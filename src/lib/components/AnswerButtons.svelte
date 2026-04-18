<script lang="ts">
	import { onMount } from 'svelte';

	let { onAnswer, disabled = false }: { onAnswer: (isMilk: boolean) => void; disabled?: boolean } =
		$props();

	function handleKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (e.key === 'm' || e.key === 'M') onAnswer(true);
		if (e.key === 'n' || e.key === 'N') onAnswer(false);
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<div class="flex w-full max-w-md gap-3">
	<button
		class="btn flex-1 border-2 border-success bg-success/10 font-bureau text-lg tracking-widest uppercase btn-lg hover:bg-success/20"
		onclick={() => onAnswer(true)}
		{disabled}
	>
		MILK
		<kbd class="ml-1 font-joke text-[0.6rem] opacity-50">[M]</kbd>
	</button>
	<button
		class="btn flex-1 border-2 border-error bg-error/10 font-bureau text-lg tracking-widest uppercase btn-lg hover:bg-error/20"
		onclick={() => onAnswer(false)}
		{disabled}
	>
		NOT MILK
		<kbd class="ml-1 font-joke text-[0.6rem] opacity-50">[N]</kbd>
	</button>
</div>
