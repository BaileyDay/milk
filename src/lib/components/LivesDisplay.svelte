<script lang="ts">
	let { lives, maxLives = 3 }: { lives: number; maxLives?: number } = $props();
</script>

<div class="flex items-center gap-1.5">
	<span class="mr-1 text-[0.55rem] tracking-[0.15em] text-secondary uppercase">Strikes:</span>
	{#each Array(maxLives) as _, i}
		<div
			class="flex h-8 w-8 items-center justify-center border-2 border-base-content text-sm transition-all duration-300 {i <
			lives
				? 'bg-base-100'
				: 'bg-error/20'}"
		>
			{#if i >= lives}
				<span class="font-bureau text-lg font-bold text-error">X</span>
			{:else}
				<span class="font-bureau text-sm text-success">&#10003;</span>
			{/if}
		</div>
	{/each}
</div>
