<script lang="ts">
	let { score, tierName, round }: { score: number; tierName: string; round: number } = $props();
</script>

<div class="flex items-center gap-4 text-sm">
	<div class="border-2 border-base-content bg-base-100 px-3 py-1.5">
		<span class="text-[0.55rem] tracking-[0.15em] text-secondary uppercase">Case File</span>
		<p class="font-bureau text-lg leading-tight">#{String(round).padStart(3, '0')}</p>
	</div>
	<div class="border-2 border-base-content bg-base-100 px-3 py-1.5">
		<span class="text-[0.55rem] tracking-[0.15em] text-secondary uppercase">Score</span>
		<p class="font-bureau text-lg leading-tight">{score}</p>
	</div>
	<div class="border-2 border-base-content bg-base-100 px-3 py-1.5">
		<span class="text-[0.55rem] tracking-[0.15em] text-secondary uppercase">Clearance</span>
		<p class="font-bureau text-xs leading-tight">{tierName}</p>
	</div>
</div>
