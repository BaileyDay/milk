<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	let {
		correct,
		message,
		explanation,
		onDismiss
	}: {
		correct: boolean;
		message: string;
		explanation?: string;
		onDismiss: () => void;
	} = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="absolute inset-0 z-10 flex items-center justify-center bg-base-content/10 backdrop-blur-xs"
	transition:fade={{ duration: 150 }}
	onclick={onDismiss}
>
	<div
		class="mx-4 max-w-sm border-2 border-base-content p-6 text-center shadow-lg {correct
			? 'bg-success'
			: 'bg-error'}"
		in:fly={{ y: -30, duration: 300 }}
	>
		<p
			class="mb-1 font-bureau text-3xl font-bold tracking-widest {correct
				? 'text-success-content'
				: 'text-error-content'}"
		>
			{correct ? 'APPROVED' : 'REJECTED'}
		</p>

		<p class="mb-3 text-sm {correct ? 'text-success-content' : 'text-error-content'}">
			{message}
		</p>

		{#if explanation}
			<div
				class="border-t pt-2 {correct ? 'border-success-content/30' : 'border-error-content/30'}"
			>
				<p
					class="font-joke text-xs italic {correct
						? 'text-success-content/80'
						: 'text-error-content/80'}"
				>
					{explanation}
				</p>
			</div>
		{/if}

		<p
			class="mt-3 text-[0.5rem] tracking-[0.1em] uppercase opacity-60 {correct
				? 'text-success-content'
				: 'text-error-content'}"
		>
			Click or wait to continue
		</p>
	</div>
</div>
