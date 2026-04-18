import { supabaseAdmin } from '$lib/server/supabase';
import { getTierForScore, getMaxTierLevel, tiers, type Tier } from '$lib/data/tiers';
import { shuffle } from '$lib/utils/shuffle';

const SESSION_TTL_MS = 30 * 60 * 1000;
const DEADLINE_GRACE_MS = 250;
const MAX_LIVES = 3;
const FEEDBACK_DELAY_MS = 1800;

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

const sessions = new Map<string, GameSession>();
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

function cleanupExpired() {
	const cutoff = Date.now() - SESSION_TTL_MS;
	for (const [id, session] of sessions) {
		if (session.createdAt < cutoff) {
			sessions.delete(id);
		}
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

export async function startSession(): Promise<StartResult> {
	cleanupExpired();
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
	sessions.set(session.id, session);

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
	sessionId: string,
	answer: boolean | 'timeout'
): Promise<AnswerResult | { error: string }> {
	cleanupExpired();
	const session = sessions.get(sessionId);
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

	// Lock this round against concurrent requests before any await.
	session.phase = 'feedback';
	session.roundEndsAt = null;

	const explanation = img.explanation;
	const all = await loadImages();

	if (session.lives <= 0) {
		session.phase = 'gameover';
		session.roundEndsAt = null;
		session.finalTierName = getTierForScore(session.score).name;
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
	sessionId: string,
	username: string
): Promise<SubmitResult | { error: string }> {
	cleanupExpired();
	const session = sessions.get(sessionId);
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

	const { data, error } = await supabaseAdmin
		.from('leaderboard')
		.insert({ username: cleanName, score: session.score, tier_name: tierName })
		.select('id')
		.single();

	if (error || !data) {
		session.submitted = false;
		return { error: 'Failed to submit score' };
	}

	const { count } = await supabaseAdmin
		.from('leaderboard')
		.select('*', { count: 'exact', head: true })
		.gt('score', session.score);

	sessions.delete(session.id);

	return {
		id: data.id as string,
		rank: (count ?? 0) + 1,
		score: session.score,
		tierName
	};
}

export function _debugSessionCount() {
	return sessions.size;
}

export { tiers };
