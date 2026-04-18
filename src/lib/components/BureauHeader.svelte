<script lang="ts">
	import Logo from './Logo.svelte';
</script>

<header class="border-b-3 border-base-content bg-base-100 px-4 py-3">
	<div class="mx-auto flex max-w-4xl items-center gap-3">
		<a href="/" class="flex items-center gap-3 no-underline">
			<Logo size="sm" />
			<div>
				<p class="text-[0.6rem] tracking-[0.3em] text-secondary uppercase">
					Official Department of
				</p>
				<h1 class="-mt-1 font-bureau text-lg leading-tight tracking-wide">THE MILK BUREAU</h1>
				<p class="text-[0.55rem] tracking-[0.2em] text-secondary uppercase">
					Est. 1952 &middot; Lactose Verification Division
				</p>
			</div>
		</a>
	</div>
</header>
