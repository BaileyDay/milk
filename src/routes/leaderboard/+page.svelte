<script lang="ts">
	import Leaderboard from '$lib/components/Leaderboard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Official Leaderboard — The Milk Bureau</title>
</svelte:head>

<section class="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
	<div>
		<p class="text-[0.6rem] tracking-[0.2em] text-secondary uppercase">Public Records Division</p>
		<h2 class="font-bureau text-2xl tracking-wide uppercase">Certified Agent Rankings</h2>
		<p class="mt-1 text-xs tracking-wide text-secondary/70 uppercase">
			Form MB-7202 &middot; Maintained in perpetuity
		</p>
	</div>

	{#if data.loadFailed}
		<p class="text-sm text-error">
			The Bureau's records are temporarily sealed. Try again shortly.
		</p>
	{/if}

	<Leaderboard entries={data.entries} loading={false} />

	<a
		href="/"
		class="btn border-2 border-base-content font-bureau text-xs tracking-widest uppercase btn-ghost"
	>
		Return to Bureau Lobby
	</a>
</section>
