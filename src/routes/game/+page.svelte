<script lang="ts">
	import { onMount } from 'svelte';
	import GameImage from '$lib/components/GameImage.svelte';
	import TimerBar from '$lib/components/TimerBar.svelte';
	import AnswerButtons from '$lib/components/AnswerButtons.svelte';
	import ScoreDisplay from '$lib/components/ScoreDisplay.svelte';
	import LivesDisplay from '$lib/components/LivesDisplay.svelte';
	import FeedbackOverlay from '$lib/components/FeedbackOverlay.svelte';
	import GameOver from '$lib/components/GameOver.svelte';
	import { getGameState, startGame, answer, skipFeedback } from '$lib/state/game.svelte';
	import { toggleMute, getSoundState } from '$lib/state/sound.svelte';

	const game = getGameState();
	const sound = getSoundState();

	onMount(() => {
		void startGame();
	});
</script>

<svelte:head>
	<title>Examination in Progress — The Milk Bureau</title>
</svelte:head>

<div class="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-6">
	{#if game.loadError}
		<div class="max-w-md text-center">
			<p class="mb-4 font-bureau text-lg tracking-wide text-error">SYSTEM ERROR</p>
			<p class="mb-4 text-sm text-secondary">{game.loadError}</p>
			<button
				class="btn border-2 border-base-content font-bureau tracking-widest uppercase btn-primary"
				onclick={() => location.reload()}
			>
				Retry
			</button>
		</div>
	{:else if game.phase === 'idle'}
		<p class="font-bureau text-lg tracking-wide text-secondary">RETRIEVING CASE FILES&hellip;</p>
	{:else if game.phase === 'gameover' && game.currentTier}
		<GameOver
			score={game.score}
			tier={game.currentTier}
			sessionId={game.sessionId ?? ''}
			feedbackMessage={game.feedback?.message ?? 'The Bureau has seen enough.'}
			onPlayAgain={() => void startGame()}
		/>
	{:else if game.currentTier}
		<!-- Game HUD -->
		<div class="flex w-full max-w-md flex-wrap items-center justify-between gap-3">
			<ScoreDisplay score={game.score} tierName={game.currentTier.name} round={game.round} />
			<LivesDisplay lives={game.lives} />
		</div>

		<!-- Image + Feedback -->
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

		<!-- Answer Buttons -->
		<AnswerButtons onAnswer={answer} disabled={game.phase !== 'showing'} />

		<div class="flex w-full max-w-md items-center justify-between">
			<p class="text-[0.5rem] tracking-[0.15em] text-secondary/40 uppercase">
				The Bureau's rulings are final &middot; Tier {game.currentTier.level} Clearance
			</p>
			<button
				class="btn font-bureau text-[0.5rem] tracking-wide text-secondary/40 uppercase btn-ghost btn-xs"
				onclick={toggleMute}
			>
				{sound.muted ? 'UNMUTE' : 'MUTE'}
			</button>
		</div>
	{/if}
</div>
