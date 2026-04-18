<script lang="ts">
	import './layout.css';
	import BureauHeader from '$lib/components/BureauHeader.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>The Milk Bureau — Official Milk Identification Certification Service</title>
	<meta
		name="description"
		content="The Milk Bureau is the world's foremost authority on milk identification. Begin your certification today."
	/>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<BureauHeader />
	<main class="flex flex-1 flex-col">
		{@render children()}
	</main>
	<footer class="border-t-3 border-base-content bg-base-100 px-4 py-4 text-center">
		<p class="text-[0.6rem] tracking-[0.2em] text-secondary uppercase">
			&copy; 1952&ndash;2026 The Milk Bureau &middot; All Rights Reserved &middot; Unauthorized Milk
			Identification Is A Federal Offense
		</p>
		<p class="mt-1 font-joke text-[0.55rem] text-secondary/60">(not really) (or is it)</p>
	</footer>
</div>
