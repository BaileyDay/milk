import { correctQuotes, wrongQuotes, gameOverQuotes, timeoutQuotes, randomQuote } from '$lib/data/quotes';
import { playSound, unlockAudio } from '$lib/state/sound.svelte';

export type GamePhase = 'idle' | 'showing' | 'feedback' | 'gameover';

interface ClientImage {
	id: string;
	src: string;
	alt: string;
}

interface ClientTier {
	level: 1 | 2 | 3 | 4 | 5;
	name: string;
	title: string;
	description: string;
	minScore: number;
	timeLimitMs: number;
}

interface FeedbackInfo {
	correct: boolean;
	message: string;
	explanation?: string;
}

let sessionId = $state<string | null>(null);
let phase = $state<GamePhase>('idle');
let score = $state(0);
let lives = $state(3);
let maxLives = $state(3);
let round = $state(0);
let currentImage = $state<ClientImage | null>(null);
let currentTier = $state<ClientTier | null>(null);
let roundEndsAt = $state<number | null>(null);
let feedback = $state<FeedbackInfo | null>(null);
let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
let roundTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
let answering = $state(false);
let loadError = $state<string | null>(null);
let advanceToNext: (() => void) | null = null;

function clearRoundTimer() {
	if (roundTimeoutHandle) {
		clearTimeout(roundTimeoutHandle);
		roundTimeoutHandle = null;
	}
}

function clearFeedbackTimer() {
	if (feedbackTimeout) {
		clearTimeout(feedbackTimeout);
		feedbackTimeout = null;
	}
}

function scheduleLocalTimeout() {
	clearRoundTimer();
	if (roundEndsAt === null) return;
	const delay = Math.max(0, roundEndsAt - Date.now()) + 50;
	roundTimeoutHandle = setTimeout(() => {
		void submit('timeout');
	}, delay);
}

function preloadImage(url: string) {
	const img = new Image();
	img.src = url;
}

async function submit(answer: boolean | 'timeout') {
	if (!sessionId) return;
	if (phase !== 'showing') return;
	if (answering) return;
	answering = true;
	clearRoundTimer();

	try {
		const res = await fetch('/api/game/answer', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId, answer })
		});
		if (!res.ok) {
			loadError = 'The Bureau rejected the submission.';
			answering = false;
			return;
		}
		const data = await res.json();

		const wasCorrect = Boolean(data.correct);
		const wasTimeout = Boolean(data.timedOut);

		playSound(wasCorrect ? 'correct' : 'wrong');

		score = data.score;
		lives = data.lives;
		round = data.round;
		currentTier = data.tier;

		let message: string;
		if (data.gameOver) {
			message = randomQuote(gameOverQuotes);
		} else if (wasCorrect) {
			message = randomQuote(correctQuotes);
		} else if (wasTimeout) {
			message = randomQuote(timeoutQuotes);
		} else {
			message = randomQuote(wrongQuotes);
		}

		feedback = {
			correct: wasCorrect,
			message,
			explanation: data.explanation ?? undefined
		};

		if (data.gameOver) {
			phase = 'gameover';
			roundEndsAt = null;
			answering = false;
			return;
		}

		phase = 'feedback';
		const nextImg: ClientImage = data.next.image;
		const nextDeadline: number = data.next.roundEndsAt;

		clearFeedbackTimer();
		const advance = () => {
			clearFeedbackTimer();
			advanceToNext = null;
			feedback = null;
			currentImage = nextImg;
			roundEndsAt = nextDeadline;
			phase = 'showing';
			scheduleLocalTimeout();
			answering = false;
			preloadImage(nextImg.src);
		};
		advanceToNext = advance;
		feedbackTimeout = setTimeout(advance, 1800);
	} catch {
		loadError = 'Network error — The Bureau is experiencing technical difficulties.';
		answering = false;
	}
}

export function getGameState() {
	return {
		get phase() {
			return phase;
		},
		get score() {
			return score;
		},
		get lives() {
			return lives;
		},
		get maxLives() {
			return maxLives;
		},
		get round() {
			return round;
		},
		get currentImage() {
			return currentImage;
		},
		get currentTier() {
			return currentTier;
		},
		get feedback() {
			return feedback;
		},
		get roundEndsAt() {
			return roundEndsAt;
		},
		get currentTimeLimitMs() {
			return currentTier?.timeLimitMs ?? 8000;
		},
		get sessionId() {
			return sessionId;
		},
		get loadError() {
			return loadError;
		}
	};
}

export async function startGame() {
	unlockAudio();
	clearFeedbackTimer();
	clearRoundTimer();
	loadError = null;
	feedback = null;
	phase = 'idle';

	try {
		const res = await fetch('/api/game/start', { method: 'POST' });
		if (!res.ok) {
			loadError = "The Bureau's filing system is temporarily unavailable. Please try again.";
			return;
		}
		const data = await res.json();
		sessionId = data.sessionId;
		score = data.score;
		lives = data.lives;
		maxLives = data.maxLives;
		round = data.round;
		currentTier = data.tier;
		currentImage = data.image;
		roundEndsAt = data.roundEndsAt;
		phase = 'showing';
		scheduleLocalTimeout();
		preloadImage(data.image.src);
	} catch {
		loadError = "The Bureau's filing system is temporarily unavailable. Please try again.";
	}
}

export function answer(isMilk: boolean) {
	void submit(isMilk);
}

export function skipFeedback() {
	if (phase === 'feedback' && advanceToNext) {
		advanceToNext();
	}
}

export function getSessionId(): string | null {
	return sessionId;
}
