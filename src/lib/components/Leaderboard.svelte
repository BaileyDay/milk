<script lang="ts">
	import { fly } from 'svelte/transition';

	interface LeaderboardEntry {
		id: string;
		username: string;
		score: number;
		tier_name: string;
		created_at: string;
	}

	let {
		entries,
		yourRank,
		loading = false
	}: {
		entries: LeaderboardEntry[];
		yourRank?: number | null;
		loading?: boolean;
	} = $props();
</script>

<div class="w-full border-2 border-base-content bg-base-100" in:fly={{ y: 20, duration: 300 }}>
	<div class="border-b-2 border-base-content px-4 py-2">
		<p class="font-bureau text-sm tracking-widest uppercase">Official Leaderboard</p>
		<p class="text-[0.55rem] tracking-[0.1em] text-secondary uppercase">Top 100 Certified Agents</p>
	</div>

	{#if loading}
		<div class="p-8 text-center">
			<p class="animate-pulse font-bureau text-sm tracking-wide text-secondary">
				RETRIEVING RECORDS...
			</p>
		</div>
	{:else if entries.length === 0}
		<div class="p-8 text-center">
			<p class="font-bureau text-sm text-secondary">No records found.</p>
			<p class="mt-1 font-joke text-xs text-secondary/60 italic">Be the first to make history.</p>
		</div>
	{:else}
		<div class="max-h-80 overflow-y-auto">
			<table class="w-full text-left text-sm">
				<thead>
					<tr
						class="border-b border-base-content bg-base-200 text-[0.6rem] tracking-[0.1em] uppercase"
					>
						<th class="px-3 py-2">#</th>
						<th class="px-3 py-2">Agent</th>
						<th class="px-3 py-2 text-right">Score</th>
						<th class="hidden px-3 py-2 sm:table-cell">Clearance</th>
					</tr>
				</thead>
				<tbody>
					{#each entries as entry, i}
						<tr
							class="border-b border-base-300 transition-colors {yourRank !== null &&
							yourRank !== undefined &&
							i + 1 === yourRank
								? 'bg-primary/10 font-bold'
								: 'hover:bg-base-200'}"
						>
							<td class="px-3 py-1.5 font-bureau text-secondary">{i + 1}</td>
							<td class="px-3 py-1.5 font-bureau">{entry.username}</td>
							<td class="px-3 py-1.5 text-right font-bureau">{entry.score}</td>
							<td class="hidden px-3 py-1.5 text-xs text-secondary sm:table-cell"
								>{entry.tier_name}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if yourRank && yourRank > 100}
			<div class="border-t-2 border-base-content px-4 py-2 text-center">
				<p class="font-bureau text-xs text-secondary">
					Your rank: <span class="text-primary">#{yourRank}</span>
				</p>
			</div>
		{/if}
	{/if}
</div>
