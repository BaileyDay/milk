<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
	import { unlockAudio } from '$lib/state/sound.svelte';
</script>

<svelte:head>
	<meta property="og:title" content="MILK OR NOT MILK — The Milk Bureau" />
	<meta
		property="og:description"
		content="Can you tell milk from not milk? Take the official Milk Bureau certification exam. Your score will be judged."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="MILK OR NOT MILK — The Milk Bureau" />
	<meta
		name="twitter:description"
		content="Can you tell milk from not milk? Take the official Milk Bureau certification exam."
	/>
</svelte:head>

<div class="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
	<div class="mb-6">
		<Logo size="lg" />
	</div>

	<h2 class="mb-2 font-bureau text-3xl tracking-wide sm:text-4xl">MILK OR NOT MILK</h2>

	<p class="mb-1 max-w-md text-xs tracking-[0.15em] text-secondary uppercase">
		Official Certification Examination
	</p>
	<p class="mb-8 max-w-md text-xs tracking-[0.1em] text-secondary/70 uppercase">
		Department of Lactose Verification &middot; Form MB-7201
	</p>

	<div class="mb-8 max-w-lg border-2 border-base-content bg-base-100 p-6 text-left">
		<p class="mb-1 text-[0.6rem] tracking-[0.2em] text-secondary uppercase">
			Notice to All Prospective Candidates
		</p>
		<div class="border-t-2 border-base-content pt-3">
			<p class="mb-3 text-sm leading-relaxed">
				The Milk Bureau requires all citizens to demonstrate basic milk identification competency.
				You will be presented with a series of images. You will determine whether each image depicts
				<strong>MILK</strong> or <strong>NOT MILK</strong>.
			</p>
			<p class="mb-3 text-sm leading-relaxed">
				You are permitted <strong>three (3) errors</strong>. A fourth error will result in immediate
				termination of your examination. The Bureau's rulings are final and not subject to appeal.
			</p>
			<p class="font-joke text-sm leading-relaxed italic">
				The Bureau wishes you adequate performance.
			</p>
		</div>
	</div>

	<a
		href="/game"
		class="btn border-2 border-base-content px-10 font-bureau text-lg tracking-widest uppercase btn-lg btn-primary"
		onclick={unlockAudio}
	>
		Begin Certification
	</a>

	<a
		href="https://discord.gg/QVFbfARHJb"
		target="_blank"
		rel="noopener noreferrer"
		class="btn mt-3 border-2 border-base-content bg-[#5865F2] font-bureau text-xs tracking-widest text-white uppercase hover:bg-[#4752c4]"
	>
		Join Discord
	</a>

	<a
		href="/leaderboard"
		class="btn mt-3 border-2 border-base-content font-bureau text-xs tracking-widest uppercase btn-ghost"
	>
		View Public Records
	</a>

	<p class="mt-4 text-[0.5rem] tracking-[0.15em] text-secondary/50 uppercase">
		Form MB-7201 Rev. 47 &middot; Approved for Public Distribution
	</p>
</div>
