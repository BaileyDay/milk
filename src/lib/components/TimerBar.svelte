<script lang="ts">
	import { getGameState } from '$lib/state/game.svelte';

	const game = getGameState();

	let now = $state(Date.now());
	let frame: number | null = null;

	$effect(() => {
		const deadline = game.roundEndsAt;
		if (deadline === null) return;

		function tick() {
			now = Date.now();
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

	const deadline = $derived(game.roundEndsAt);
	const limit = $derived(game.currentTimeLimitMs);
	const remainingMs = $derived(deadline === null ? limit : Math.max(0, deadline - now));
	const remainingPct = $derived(Math.max(0, Math.min(100, (remainingMs / limit) * 100)));
	const isDanger = $derived(remainingMs <= 1500);
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
