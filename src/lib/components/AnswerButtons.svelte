<script lang="ts">
	import { onMount } from 'svelte';

	let { onAnswer, disabled = false }: { onAnswer: (isMilk: boolean) => void; disabled?: boolean } =
		$props();

	let pending = $state<'milk' | 'not-milk' | null>(null);

	$effect(() => {
		if (disabled) pending = null;
	});

	function submit(isMilk: boolean) {
		if (disabled || pending) return;
		pending = isMilk ? 'milk' : 'not-milk';
		onAnswer(isMilk);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (disabled || pending) return;
		if (e.key === 'm' || e.key === 'M') submit(true);
		if (e.key === 'n' || e.key === 'N') submit(false);
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div class="flex w-full max-w-md gap-3">
	<button
		class="btn flex-1 border-2 border-success bg-success/10 font-bureau text-lg tracking-widest uppercase btn-lg hover:bg-success/20"
		onclick={() => submit(true)}
		disabled={disabled || pending !== null}
	>
		{#if pending === 'milk'}
			<span class="loading loading-spinner loading-sm"></span>
		{:else}
			MILK
			<kbd class="ml-1 font-joke text-[0.6rem] opacity-50">[M]</kbd>
		{/if}
	</button>
	<button
		class="btn flex-1 border-2 border-error bg-error/10 font-bureau text-lg tracking-widest uppercase btn-lg hover:bg-error/20"
		onclick={() => submit(false)}
		disabled={disabled || pending !== null}
	>
		{#if pending === 'not-milk'}
			<span class="loading loading-spinner loading-sm"></span>
		{:else}
			NOT MILK
			<kbd class="ml-1 font-joke text-[0.6rem] opacity-50">[N]</kbd>
		{/if}
	</button>
</div>
