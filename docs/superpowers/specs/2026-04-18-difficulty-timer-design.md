# Difficulty-Scaling Timer — Design

**Date:** 2026-04-18
**Status:** Approved, pending implementation

## Summary

Add a per-round countdown timer whose duration shrinks as the player advances through tiers. A timeout costs one life (treated as a strike, identical to a wrong answer). A visible shrinking bar sits above the game image and pulses red in the final ~1.5 seconds.

## Motivation

The game currently has no time pressure. Players can study each image indefinitely, which undercuts the "Bureau exam" tone and makes higher tiers no harder than tier 1 — only the images change. A tier-scaling timer adds mechanical difficulty that matches the narrative escalation ("The Bureau is alarmed").

## Behavior

### Per-tier durations

| Tier | Name | Time limit |
|------|---------------|------------|
| 1    | Milk Cadet    | 8000 ms    |
| 2    | Milk Inspector| 6000 ms    |
| 3    | Milk Detective| 5000 ms    |
| 4    | Milk Commander| 4000 ms    |
| 5    | Milk Supreme  | 3000 ms    |

### Timer lifecycle

- The timer starts the moment the game enters `phase === 'showing'` — specifically at the end of `startGame()` and `nextImage()`.
- The timer stops immediately when the player answers (via `answer()`) or when it expires (via internal `handleTimeout()`).
- The timer does **not** run during `feedback` or `gameover` phases, and is explicitly cleared on transition out of `showing`.
- Tab visibility does **not** pause the timer. It runs on wall-clock regardless of focus.
- If a correct answer advances the player to a new tier mid-game, the *next* round uses the new tier's duration. The in-flight round is unaffected.

### Timeout handling

On timeout:

1. `lives--` and play the `wrong` sound.
2. If `lives <= 0`: set `phase = 'gameover'` with `feedback.message = randomQuote(gameOverQuotes)` (matching existing wrong-answer-at-zero-lives behavior) and the image's `explanation`.
3. Otherwise: set `phase = 'feedback'` with `feedback = { correct: false, message: randomQuote(timeoutQuotes), explanation: image.explanation }`, and schedule the existing 1.8s feedback timeout to call `nextImage()`.

Timeout feedback is structurally identical to a wrong answer — the only differences are the quote pool and that no answer was submitted.

### UI

- A new component `TimerBar` sits directly above `GameImage`, matching its horizontal extent.
- The bar is a full-width track with a filled inner segment that shrinks from 100% → 0% over the tier's duration.
- Border and color follow the bureau style (border-2, base-content border, primary fill).
- During the final 1500 ms, the fill switches to the DaisyUI `error` color and pulses (CSS keyframe animation).
- No numeric countdown is rendered.
- The bar is only mounted when `phase === 'showing'`. Unmounting on transition out of `showing` is what visually "stops" it.

## Code changes

### `src/lib/data/tiers.ts`

Add `timeLimitMs: number` to the `Tier` interface and to each entry in the `tiers` array. Values as specified in the table above.

### `src/lib/data/quotes.ts`

Add a new exported `timeoutQuotes: string[]` pool of 5–8 bureaucratic one-liners. Example tone: "TIME EXPIRED — The Bureau does not wait.", "Indecision is its own answer.", "The clock has rendered its verdict."

### `src/lib/state/game.svelte.ts`

- Add module-level state: `let roundStartTime = $state<number | null>(null)` and `let roundTimeoutHandle: ReturnType<typeof setTimeout> | null = null`.
- Add a derived/exposed getter: `currentTimeLimitMs` — returns `getTierForScore(score).timeLimitMs`.
- Add a helper `startRoundTimer()` that sets `roundStartTime = performance.now()` and schedules `roundTimeoutHandle = setTimeout(handleTimeout, currentTimeLimitMs)`. Call it at the end of `startGame()` and `nextImage()` right after `phase = 'showing'`.
- Add a helper `clearRoundTimer()` that clears the timeout handle and nulls `roundStartTime`. Call it at the start of `answer()` (before any mutation), in `handleTimeout()` itself, and at the top of `nextImage()` for safety.
- Add a private `handleTimeout()` function. Guarded by `if (phase !== 'showing') return;` (belt-and-suspenders — the timer should be cleared before any phase change, but guard against races). Mirrors the wrong-answer branch of `answer()`: `lives--`, play `wrong` sound, build `feedback` from `timeoutQuotes`, transition to `feedback` or `gameover` exactly as `answer()` does.
- Expose `get roundStartTime()` and `get currentTimeLimitMs()` on the object returned by `getGameState()` so `TimerBar` can compute remaining time.

### `src/lib/components/TimerBar.svelte` (new)

- Props: none — reads `game.roundStartTime` and `game.currentTimeLimitMs` from `getGameState()`.
- Uses `requestAnimationFrame` loop (started in `$effect`, cancelled on cleanup) to update a `$state` `elapsed` value while mounted.
- Renders a wrapper div with border, containing an inner div whose width is `max(0, (1 - elapsed / limit) * 100)%`.
- When `elapsed >= limit - 1500`, adds a class that switches to the error color and applies a `pulse` animation (defined in the component's `<style>` block or via Tailwind's `animate-pulse`).

### `src/routes/game/+page.svelte`

Inside the image wrapper (`<div class="relative w-full max-w-md">`), render `{#if game.phase === 'showing'}<TimerBar />{/if}` directly above the `<GameImage>`.

## Edge cases

- **Race between timeout firing and answer click:** `clearRoundTimer()` at the top of `answer()` prevents a late timer fire from double-counting. The `handleTimeout` phase guard is a secondary safety net.
- **Game-over on timeout:** Lives hitting zero from a timeout produces the same `phase = 'gameover'` state as a wrong answer, so `GameOver.svelte` needs no changes.
- **Mid-round tier advance:** Not possible — `answer()` clears the timer before mutating score, and `nextImage()` reads the new tier when it starts the next round's timer.
- **Component unmount mid-round (route change, hot reload):** `TimerBar`'s `$effect` cleanup cancels the animation frame. The `setTimeout` handle lives on the state module and would fire, but the phase guard in `handleTimeout` prevents state mutation if the game has been reset. The next `startGame()` clears any stale handle.
- **First image of a fresh game:** `startGame()` sets `phase = 'showing'` then starts the timer, so the timer is active for round 1.

## Testing

Manual verification (no test suite exists in this project):

- T1 countdown runs for ~8s, bar empties smoothly, pulses red in final 1.5s.
- Answering correctly before expiry advances without triggering a timeout.
- Letting the timer run out: loses a life, shows timeout quote, advances to next round after 1.8s.
- Timing out on the last life: goes to game-over with a timeout quote.
- Crossing a tier threshold mid-game: next round uses the new (shorter) duration.
- Rapid-answer stress: answer within ~50ms of timeout firing — verify no double life loss.

## Out of scope

- Speed bonuses (faster answers → more score) — not in this design.
- Numeric countdown display — explicitly rejected in favor of the bar.
- Tab-visibility pause behavior — explicitly rejected.
- Configurable difficulty (easy/normal/hard) — not in this design.
