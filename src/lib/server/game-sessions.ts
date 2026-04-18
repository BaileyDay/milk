import type { KVNamespace } from '@cloudflare/workers-types';
import { supabaseAdmin } from '$lib/server/supabase';
import { getTierForScore, getMaxTierLevel, tiers, type Tier } from '$lib/data/tiers';
import { shuffle } from '$lib/utils/shuffle';

const SESSION_TTL_SECONDS = 30 * 60;
const DEADLINE_GRACE_MS = 250;
const MAX_LIVES = 3;
const KV_PREFIX = 'session:';

export type GamePhase = 'showing' | 'feedback' | 'gameover';

export interface ServerImage {
	id: string;
	src: string;
	alt: string;
	isMilk: boolean;
	tier: 1 | 2 | 3 | 4 | 5;
	explanation: string | null;
}

export interface GameSession {
	id: string;
	createdAt: number;
	phase: GamePhase;
	score: number;
	lives: number;
	round: number;
	pool: ServerImage[];
	currentIndex: number;
	maxTier: number;
	roundEndsAt: number | null;
	finalTierName: string | null;
	submitted: boolean;
}

const memorySessions = new Map<string, GameSession>();
let imageCache: ServerImage[] | null = null;
let imageCacheAt = 0;
const IMAGE_CACHE_TTL_MS = 60 * 1000;

async function loadImages(): Promise<ServerImage[]> {
	const now = Date.now();
	if (imageCache && now - imageCacheAt < IMAGE_CACHE_TTL_MS) {
		return imageCache;
	}
	const { data, error } = await supabaseAdmin
		.from('images')
		.select('id, src, is_milk, tier, alt, explanation')
		.eq('enabled', true);
	if (error || !data) {
		throw new Error('Failed to load images');
	}
	imageCache = data.map((row) => ({
		id: row.id as string,
		src: row.src as string,
		alt: row.alt as string,
		isMilk: row.is_milk as boolean,
		tier: row.tier as 1 | 2 | 3 | 4 | 5,
		explanation: (row.explanation as string | null) ?? null
	}));
	imageCacheAt = now;
	return imageCache;
}

async function readSession(kv: KVNamespace | undefined, id: string): Promise<GameSession | null> {
	if (kv) {
		const raw = await kv.get(KV_PREFIX + id);
		if (!raw) return null;
		try {
			return JSON.parse(raw) as GameSession;
		} catch {
			return null;
		}
	}
	sweepMemoryExpired();
	return memorySessions.get(id) ?? null;
}

async function writeSession(
	kv: KVNamespace | undefined,
	session: GameSession,
	deleted: boolean
): Promise<void> {
	if (kv) {
		if (deleted) {
			await kv.delete(KV_PREFIX + session.id);
		} else {
			await kv.put(KV_PREFIX + session.id, JSON.stringify(session), {
				expirationTtl: SESSION_TTL_SECONDS
			});
		}
		return;
	}
	if (deleted) {
		memorySessions.delete(session.id);
	} else {
		memorySessions.set(session.id, session);
	}
}

function sweepMemoryExpired() {
	const cutoff = Date.now() - SESSION_TTL_SECONDS * 1000;
	for (const [id, session] of memorySessions) {
		if (session.createdAt < cutoff) memorySessions.delete(id);
	}
}

function buildPool(all: ServerImage[], maxTier: number): ServerImage[] {
	return shuffle(all.filter((img) => img.tier <= maxTier));
}

function advancePool(session: GameSession, all: ServerImage[]) {
	const newMaxTier = getMaxTierLevel(session.score);
	if (newMaxTier > session.maxTier) {
		const remaining = session.pool.slice(session.currentIndex + 1);
		const newImages = shuffle(all.filter((img) => img.tier === newMaxTier));
		session.pool = [...remaining, ...newImages];
		session.currentIndex = 0;
		session.maxTier = newMaxTier;
		return;
	}
	session.currentIndex++;
	if (session.currentIndex >= session.pool.length) {
		session.pool = buildPool(all, session.maxTier);
		session.currentIndex = 0;
	}
}

function scheduleRoundDeadline(session: GameSession) {
	const tier = getTierForScore(session.score);
	session.roundEndsAt = Date.now() + tier.timeLimitMs;
}

function currentImage(session: GameSession): ServerImage | null {
	return session.pool[session.currentIndex] ?? null;
}

function publicImage(img: ServerImage) {
	return { id: img.id, src: img.src, alt: img.alt };
}

function publicTier(tier: Tier) {
	return {
		level: tier.level,
		name: tier.name,
		title: tier.title,
		description: tier.description,
		minScore: tier.minScore,
		timeLimitMs: tier.timeLimitMs
	};
}

export interface StartResult {
	sessionId: string;
	score: number;
	lives: number;
	maxLives: number;
	round: number;
	tier: ReturnType<typeof publicTier>;
	image: ReturnType<typeof publicImage>;
	roundEndsAt: number;
	phase: GamePhase;
}

export async function startSession(kv: KVNamespace | undefined): Promise<StartResult> {
	const all = await loadImages();
	if (all.length === 0) throw new Error('No images available');

	const pool = buildPool(all, 1);
	const session: GameSession = {
		id: crypto.randomUUID(),
		createdAt: Date.now(),
		phase: 'showing',
		score: 0,
		lives: MAX_LIVES,
		round: 1,
		pool,
		currentIndex: 0,
		maxTier: 1,
		roundEndsAt: null,
		finalTierName: null,
		submitted: false
	};
	scheduleRoundDeadline(session);
	await writeSession(kv, session, false);

	const img = currentImage(session);
	if (!img) throw new Error('No image to serve');

	return {
		sessionId: session.id,
		score: session.score,
		lives: session.lives,
		maxLives: MAX_LIVES,
		round: session.round,
		tier: publicTier(getTierForScore(session.score)),
		image: publicImage(img),
		roundEndsAt: session.roundEndsAt!,
		phase: session.phase
	};
}

export interface AnswerResult {
	correct: boolean;
	timedOut: boolean;
	explanation: string | null;
	score: number;
	lives: number;
	round: number;
	phase: GamePhase;
	tier: ReturnType<typeof publicTier>;
	next: {
		image: ReturnType<typeof publicImage>;
		roundEndsAt: number;
	} | null;
	gameOver: boolean;
}

export async function submitAnswer(
	kv: KVNamespace | undefined,
	sessionId: string,
	answer: boolean | 'timeout'
): Promise<AnswerResult | { error: string }> {
	const session = await readSession(kv, sessionId);
	if (!session) return { error: 'Session not found or expired' };
	if (session.phase !== 'showing') return { error: 'Round not active' };

	const img = currentImage(session);
	if (!img) return { error: 'No current image' };

	const now = Date.now();
	const expired =
		session.roundEndsAt !== null && now > session.roundEndsAt + DEADLINE_GRACE_MS;
	const isTimeout = answer === 'timeout' || expired;

	let correct = false;
	if (!isTimeout) {
		correct = typeof answer === 'boolean' && answer === img.isMilk;
	}

	if (correct) {
		session.score++;
	} else {
		session.lives--;
	}

	const explanation = img.explanation;
	const all = await loadImages();

	if (session.lives <= 0) {
		session.phase = 'gameover';
		session.roundEndsAt = null;
		session.finalTierName = getTierForScore(session.score).name;
		await writeSession(kv, session, false);
		return {
			correct,
			timedOut: isTimeout,
			explanation,
			score: session.score,
			lives: session.lives,
			round: session.round,
			phase: session.phase,
			tier: publicTier(getTierForScore(session.score)),
			next: null,
			gameOver: true
		};
	}

	advancePool(session, all);
	session.round++;
	scheduleRoundDeadline(session);
	session.phase = 'showing';
	await writeSession(kv, session, false);

	const nextImg = currentImage(session);
	if (!nextImg) {
		return { error: 'No next image' };
	}

	return {
		correct,
		timedOut: isTimeout,
		explanation,
		score: session.score,
		lives: session.lives,
		round: session.round,
		phase: session.phase,
		tier: publicTier(getTierForScore(session.score)),
		next: {
			image: publicImage(nextImg),
			roundEndsAt: session.roundEndsAt!
		},
		gameOver: false
	};
}

export interface SubmitResult {
	id: string;
	rank: number;
	score: number;
	tierName: string;
}

export async function submitFinal(
	kv: KVNamespace | undefined,
	sessionId: string,
	username: string
): Promise<SubmitResult | { error: string }> {
	const session = await readSession(kv, sessionId);
	if (!session) return { error: 'Session not found or expired' };
	if (session.phase !== 'gameover') return { error: 'Game is not over' };
	if (session.submitted) return { error: 'Score already submitted' };

	const cleanName = username.trim();
	if (!cleanName || cleanName.length < 1 || cleanName.length > 20) {
		return { error: 'Username must be 1-20 characters' };
	}
	if (/https?:\/\//i.test(cleanName)) {
		return { error: 'Username may not contain URLs' };
	}

	const tierName = session.finalTierName ?? getTierForScore(session.score).name;
	session.submitted = true;
	await writeSession(kv, session, false);

	const { data, error } = await supabaseAdmin
		.from('leaderboard')
		.insert({ username: cleanName, score: session.score, tier_name: tierName })
		.select('id')
		.single();

	if (error || !data) {
		session.submitted = false;
		await writeSession(kv, session, false);
		return { error: 'Failed to submit score' };
	}

	const { count } = await supabaseAdmin
		.from('leaderboard')
		.select('*', { count: 'exact', head: true })
		.gt('score', session.score);

	await writeSession(kv, session, true);

	return {
		id: data.id as string,
		rank: (count ?? 0) + 1,
		score: session.score,
		tierName
	};
}

export { tiers };
