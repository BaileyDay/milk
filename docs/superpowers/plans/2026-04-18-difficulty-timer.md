# Difficulty-Scaling Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-round countdown timer that shrinks with tier difficulty; a timeout counts as a strike (loses a life).

**Architecture:** Timer state lives in `src/lib/state/game.svelte.ts` alongside the existing game state. A `setTimeout`-based deadline drives the strike logic; a `requestAnimationFrame` loop in a new `TimerBar.svelte` component drives the smooth visual countdown. Tier durations are added to the existing `tiers` data. Timeout feedback reuses the existing feedback → nextImage flow, with a new `timeoutQuotes` pool.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes: `$state`, `$derived`, `$effect`), TypeScript, Tailwind v4 + DaisyUI.

**Spec:** `docs/superpowers/specs/2026-04-18-difficulty-timer-design.md`

**Note on testing:** This project has no test suite (no `test` npm script, no test runner installed). Verification in each task is manual — via `npm run check` (TypeScript + Svelte) and browser testing with `npm run dev`. There is no git repo, so "commit" steps are omitted.

---

## File Structure

- **Modify** `src/lib/data/tiers.ts` — add `timeLimitMs` to the `Tier` interface and to each tier entry.
- **Modify** `src/lib/data/quotes.ts` — add `timeoutQuotes` array.
- **Modify** `src/lib/state/game.svelte.ts` — add round-timer state, `startRoundTimer`, `clearRoundTimer`, `handleTimeout`; expose `roundStartTime` and `currentTimeLimitMs`.
- **Create** `src/lib/components/TimerBar.svelte` — the visual countdown bar.
- **Modify** `src/routes/game/+page.svelte` — mount `TimerBar` above `GameImage` when `phase === 'showing'`.

---

## Task 1: Add `timeLimitMs` to tier data

**Files:**
- Modify: `src/lib/data/tiers.ts`

- [ ] **Step 1: Add `timeLimitMs` to the `Tier` interface**

Edit `src/lib/data/tiers.ts`, replace the `Tier` interface (lines 1–7):

```ts
export interface Tier {
	level: 1 | 2 | 3 | 4 | 5;
	name: string;
	title: string;
	description: string;
	minScore: number;
	timeLimitMs: number;
}
```

- [ ] **Step 2: Add `timeLimitMs` to each entry in the `tiers` array**

Update each entry in the `tiers` array (lines 9–45). Add `timeLimitMs` as the last field on each object:

- Level 1: `timeLimitMs: 8000`
- Level 2: `timeLimitMs: 6000`
- Level 3: `timeLimitMs: 5000`
- Level 4: `timeLimitMs: 4000`
- Level 5: `timeLimitMs: 3000`

The final file should look like:

```ts
export interface Tier {
	level: 1 | 2 | 3 | 4 | 5;
	name: string;
	title: string;
	description: string;
	minScore: number;
	timeLimitMs: number;
}

export const tiers: Tier[] = [
	{
		level: 1,
		minScore: 0,
		name: 'Milk Cadet',
		title: 'Provisional Milk Identification Trainee',
		description: 'The Bureau has assigned you the simplest cases.',
		timeLimitMs: 8000
	},
	{
		level: 2,
		minScore: 5,
		name: 'Milk Inspector',
		title: 'Junior Milk Verification Officer',
		description: 'You have demonstrated baseline competence. Do not let it go to your head.',
		timeLimitMs: 6000
	},
	{
		level: 3,
		minScore: 12,
		name: 'Milk Detective',
		title: 'Senior Dairy Forensics Analyst',
		description: 'The Bureau acknowledges your growing aptitude. Suspiciously growing.',
		timeLimitMs: 5000
	},
	{
		level: 4,
		minScore: 22,
		name: 'Milk Commander',
		title: 'Deputy Director of Lactose Intelligence',
		description: 'Your skills are... concerning. The Bureau is watching.',
		timeLimitMs: 4000
	},
	{
		level: 5,
		minScore: 35,
		name: 'Milk Supreme',
		title: 'Supreme Chancellor of the Milk Bureau',
		description: 'The Bureau has never seen anything like this. We are alarmed.',
		timeLimitMs: 3000
	}
];

export function getTierForScore(score: number): Tier {
	for (let i = tiers.length - 1; i >= 0; i--) {
		if (score >= tiers[i].minScore) return tiers[i];
	}
	return tiers[0];
}

export function getMaxTierLevel(score: number): number {
	return getTierForScore(score).level;
}
```

- [ ] **Step 3: Verify with `npm run check`**

Run: `npm run check`
Expected: No new errors. Any existing usages of `Tier` should continue to compile (we only added a field).

---

## Task 2: Add `timeoutQuotes` pool

**Files:**
- Modify: `src/lib/data/quotes.ts`

- [ ] **Step 1: Add the `timeoutQuotes` export**

Edit `src/lib/data/quotes.ts`. Insert this block between the `gameOverQuotes` array (ends at line 33) and the `randomQuote` function (starts at line 35):

```ts
export const timeoutQuotes = [
	'TIME EXPIRED. The Bureau does not wait.',
	'Indecision is its own answer. The Bureau has recorded it.',
	'The clock has rendered its verdict. It is not in your favor.',
	'Your hesitation has been filed. The Bureau is unimpressed.',
	'Time is a resource the Bureau does not grant twice.',
	'Tardiness is a form of incompetence. So noted.',
	'The Bureau counted. You did not answer. Draw your own conclusions.'
];
```

- [ ] **Step 2: Verify with `npm run check`**

Run: `npm run check`
Expected: No new errors.

---

## Task 3: Wire round-timer state into `game.svelte.ts`

**Files:**
- Modify: `src/lib/state/game.svelte.ts`

- [ ] **Step 1: Update imports**

At the top of `src/lib/state/game.svelte.ts`, update the `quotes` import (line 3) to include `timeoutQuotes`:

```ts
import {
	correctQuotes,
	wrongQuotes,
	gameOverQuotes,
	timeoutQuotes,
	randomQuote
} from '$lib/data/quotes';
```

- [ ] **Step 2: Add round-timer module state**

After the existing state declarations (after line 25, the `feedbackTimeout` line), add:

```ts
let roundStartTime = $state<number | null>(null);
let roundTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
```

- [ ] **Step 3: Add `clearRoundTimer` and `startRoundTimer` helpers**

After `preloadUpcoming()` (after line 39), add these two helpers:

```ts
function clearRoundTimer() {
	if (roundTimeoutHandle) {
		clearTimeout(roundTimeoutHandle);
		roundTimeoutHandle = null;
	}
	roundStartTime = null;
}

function startRoundTimer() {
	clearRoundTimer();
	const limit = getTierForScore(score).timeLimitMs;
	roundStartTime = performance.now();
	roundTimeoutHandle = setTimeout(handleTimeout, limit);
}
```

Note: `handleTimeout` is defined in the next step and is referenced here by hoisted `function` declaration. Keep it as a `function` declaration (not a `const`) to preserve hoisting.

- [ ] **Step 4: Add `handleTimeout` function**

Add this function after `startRoundTimer` (before `getGameState`):

```ts
function handleTimeout() {
	if (phase !== 'showing') return;

	const image = shuffledImages[currentImageIndex];
	if (!image) return;

	clearRoundTimer();
	lives--;
	playSound('wrong');

	if (lives <= 0) {
		feedback = {
			correct: false,
			message: randomQuote(gameOverQuotes),
			explanation: image.explanation
		};
		phase = 'gameover';
		return;
	}

	feedback = {
		correct: false,
		message: randomQuote(timeoutQuotes),
		explanation: image.explanation
	};
	phase = 'feedback';

	if (feedbackTimeout) clearTimeout(feedbackTimeout);
	feedbackTimeout = setTimeout(() => {
		nextImage();
	}, 1800);
}
```

- [ ] **Step 5: Expose `roundStartTime` and `currentTimeLimitMs` from `getGameState`**

Inside `getGameState` (starts at line 41), do two things:

**5a.** After the existing `$derived` lines (after line 44, the `maxTierLevel` line), add:

```ts
const currentTimeLimitMs = $derived(getTierForScore(score).timeLimitMs);
```

**5b.** In the returned object, add two new getters after `get hasImages()`. The end of the return object should read exactly:

```ts
		get hasImages() {
			return allImages.length > 0;
		},
		get roundStartTime() {
			return roundStartTime;
		},
		get currentTimeLimitMs() {
			return currentTimeLimitMs;
		}
	};
}
```

(Note the comma added after the closing brace of `hasImages` — it was previously the last property.)

- [ ] **Step 6: Start the timer at the end of `startGame`**

In `startGame` (lines 84–95), add `startRoundTimer()` as the last line of the function body:

```ts
export function startGame() {
	if (allImages.length === 0) return;
	unlockAudio();
	score = 0;
	lives = MAX_LIVES;
	round = 1;
	currentImageIndex = 0;
	feedback = null;
	shuffledImages = buildImagePool(1);
	phase = 'showing';
	preloadUpcoming();
	startRoundTimer();
}
```

- [ ] **Step 7: Clear the timer at the top of `answer`**

In `answer` (lines 97–135), add `clearRoundTimer()` immediately after the early-return guards:

```ts
export function answer(isMilk: boolean) {
	if (phase !== 'showing') return;

	const image = shuffledImages[currentImageIndex];
	if (!image) return;

	clearRoundTimer();

	const correct = image.isMilk === isMilk;
	// ...rest of function unchanged
}
```

- [ ] **Step 8: Start the timer at the end of `nextImage`**

In `nextImage` (lines 137–168), add `clearRoundTimer()` at the very top and `startRoundTimer()` at the very bottom:

```ts
export function nextImage() {
	clearRoundTimer();
	if (feedbackTimeout) {
		clearTimeout(feedbackTimeout);
		feedbackTimeout = null;
	}

	round++;
	feedback = null;

	// ... existing pool-rebuild logic unchanged ...

	phase = 'showing';
	preloadUpcoming();
	startRoundTimer();
}
```

- [ ] **Step 9: Verify with `npm run check`**

Run: `npm run check`
Expected: No TypeScript or Svelte errors.

- [ ] **Step 10: Manual smoke test**

Run: `npm run dev`
- Start a game. Confirm no console errors.
- Answer correctly: game advances normally (behavior unchanged for now — the bar component doesn't exist yet).
- Wait 8+ seconds without answering on tier 1. Expected: lose a life, see a timeout quote in the feedback overlay, advance to next image.
- Let the timer expire three times in a row. Expected: game-over phase with a `gameOverQuote` message.

---

## Task 4: Create `TimerBar.svelte`

**Files:**
- Create: `src/lib/components/TimerBar.svelte`

- [ ] **Step 1: Create the component**

Create `src/lib/components/TimerBar.svelte` with:

```svelte
<script lang="ts">
	import { getGameState } from '$lib/state/game.svelte';

	const game = getGameState();

	let elapsed = $state(0);
	let frame: number | null = null;

	$effect(() => {
		const start = game.roundStartTime;
		if (start === null) {
			elapsed = 0;
			return;
		}

		function tick() {
			elapsed = performance.now() - (start as number);
			frame = requestAnimationFrame(tick);
		}
		tick();

		return () => {
			if (frame !== null) {
				cancelAnimationFrame(frame);
				frame = null;
			}
		};
	});

	const limit = $derived(game.currentTimeLimitMs);
	const remainingPct = $derived(Math.max(0, Math.min(100, (1 - elapsed / limit) * 100)));
	const isDanger = $derived(limit - elapsed <= 1500);
</script>

<div class="mb-2 h-3 w-full border-2 border-base-content bg-base-100">
	<div
		class="h-full transition-[background-color] duration-150"
		class:bg-primary={!isDanger}
		class:bg-error={isDanger}
		class:animate-pulse={isDanger}
		style:width="{remainingPct}%"
	></div>
</div>
```

- [ ] **Step 2: Run the Svelte autofixer**

Use the `svelte-autofixer` MCP tool on the file contents. Apply any fixes it suggests. Re-run until it returns no issues.

- [ ] **Step 3: Verify with `npm run check`**

Run: `npm run check`
Expected: No TypeScript or Svelte errors.

---

## Task 5: Mount `TimerBar` in the game page

**Files:**
- Modify: `src/routes/game/+page.svelte`

- [ ] **Step 1: Import `TimerBar`**

In the `<script>` block of `src/routes/game/+page.svelte`, add the import near the other component imports (after line 3):

```svelte
import TimerBar from '$lib/components/TimerBar.svelte';
```

- [ ] **Step 2: Render `TimerBar` above `GameImage`**

Inside the image wrapper div (starts around line 69, `<div class="relative w-full max-w-md">`), add the TimerBar above the GameImage, guarded by phase:

```svelte
<div class="relative w-full max-w-md">
	{#if game.phase === 'showing'}
		<TimerBar />
	{/if}
	{#if game.currentImage}
		<GameImage src={game.currentImage.src} alt={game.currentImage.alt} />
	{/if}

	{#if game.phase === 'feedback' && game.feedback}
		<FeedbackOverlay
			correct={game.feedback.correct}
			message={game.feedback.message}
			explanation={game.feedback.explanation}
			onDismiss={skipFeedback}
		/>
	{/if}
</div>
```

- [ ] **Step 3: Run the Svelte autofixer on the modified file**

Use the `svelte-autofixer` MCP tool on the file contents. Apply any fixes it suggests. Re-run until it returns no issues.

- [ ] **Step 4: Verify with `npm run check`**

Run: `npm run check`
Expected: No TypeScript or Svelte errors.

---

## Task 6: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Open the printed URL in a browser.

- [ ] **Step 2: Tier 1 countdown visual**

- Start a game. Observe the thin bar above the image shrinking left-to-right over ~8 seconds.
- In the final ~1.5 seconds, the bar should turn red and pulse.

- [ ] **Step 3: Correct answer clears the timer**

- On a fresh image, answer before the timer runs out. Expected: normal feedback, no timeout triggered. The next round's timer restarts at full width.

- [ ] **Step 4: Timeout costs a life**

- Start a new game. Do not answer. Wait for the bar to empty.
- Expected: `wrong` sound plays, feedback overlay shows a quote from `timeoutQuotes` plus the image's explanation, life count drops by one. After 1.8s, advance to next image with a fresh timer.

- [ ] **Step 5: Timeout on the last life ends the game**

- Lose two lives (via wrong answers or timeouts). On the third round, let the timer expire.
- Expected: game-over screen. The final message comes from `gameOverQuotes`.

- [ ] **Step 6: Tier advancement shortens the timer**

- Play until score reaches 5 (tier 2). Observe that the next round's bar empties in ~6 seconds instead of 8.
- Continue to tier 3 at score 12: ~5 seconds.

- [ ] **Step 7: Race-condition spot check**

- Deliberately click an answer button within ~100ms of the bar hitting zero multiple times.
- Expected: exactly one outcome fires per round — either the answer or the timeout, never both. Life count should never drop by 2 in one round.

- [ ] **Step 8: Rapid restart**

- Trigger game-over, then click "Play Again" (or the equivalent restart control from `GameOver.svelte`).
- Expected: fresh game, timer starts cleanly, no stale timeout firing on the first round.

---

## Self-review checklist (for plan author)

- [x] Spec section "Per-tier durations" → Task 1
- [x] Spec section "Timer lifecycle" (start, stop, clear-on-phase-change, no visibility pause) → Task 3 (steps 3, 6, 7, 8) and Task 4 (the `$effect` only runs while mounted, and the component only mounts when `phase === 'showing'`)
- [x] Spec section "Timeout handling" (lose life, sound, feedback or gameover) → Task 3, step 4
- [x] Spec section "UI" (bar above image, pulse red in last 1.5s, no number) → Task 4
- [x] Spec code changes in `tiers.ts`, `quotes.ts`, `game.svelte.ts`, new `TimerBar.svelte`, `game/+page.svelte` → Tasks 1–5
- [x] Spec edge case "race between timeout and answer click" → Task 6 step 7
- [x] Spec edge case "timeout on last life → gameover with gameOverQuotes" → Task 3 step 4 + Task 6 step 5
- [x] Spec edge case "mid-round tier advance" → covered implicitly (timer is cleared in `answer`, started in `nextImage` using fresh tier)
- [x] Spec edge case "component unmount mid-round" → Task 4's `$effect` cleanup
- [x] Spec edge case "first image of a fresh game" → Task 3 step 6 (`startRoundTimer()` at end of `startGame`)
