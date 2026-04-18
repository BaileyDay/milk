<script lang="ts">
	let { src, alt }: { src: string; alt: string } = $props();

	let loaded = $state(false);
	let error = $state(false);
</script>

{#key src}
	<div
		class="relative aspect-square w-full max-w-md overflow-hidden border-2 border-base-content bg-base-100"
	>
		{#if !loaded && !error}
			<div class="absolute inset-0 flex items-center justify-center">
				<span class="animate-pulse font-bureau text-sm tracking-wide text-secondary"
					>EVIDENCE LOADING...</span
				>
			</div>
		{/if}

		{#if error}
			<div class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
				<span class="font-bureau text-sm tracking-wide text-error">IMAGE REDACTED</span>
				<span class="font-joke text-xs text-secondary/60">
					(image file not found — add it to static/images/)
				</span>
			</div>
		{/if}

		<img
			{src}
			{alt}
			class="h-full w-full object-cover transition-opacity duration-200"
			class:opacity-0={!loaded || error}
			onload={() => {
				loaded = true;
				error = false;
			}}
			onerror={() => {
				error = true;
				loaded = false;
			}}
		/>

		<div
			class="absolute top-0 right-0 border-b-2 border-l-2 border-base-content bg-base-200 px-2 py-0.5"
		>
			<span class="text-[0.55rem] tracking-[0.15em] text-secondary uppercase">Exhibit</span>
		</div>
	</div>
{/key}
