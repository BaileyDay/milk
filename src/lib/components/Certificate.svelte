<script lang="ts">
	import type { Tier } from '$lib/data/tiers';
	import { generateCertificate, downloadCertificate } from '$lib/utils/certificate';

	let { username, score, tier }: { username: string; score: number; tier: Tier } = $props();

	let generating = $state(false);
	let certUrl = $state<string | null>(null);

	async function generate() {
		generating = true;
		certUrl = await generateCertificate({ username, score, tier });
		generating = false;
	}

	function download() {
		if (certUrl) downloadCertificate(certUrl, username);
	}
</script>

<div class="flex flex-col items-center gap-3">
	{#if certUrl}
		<div class="w-full border-2 border-base-content">
			<img src={certUrl} alt="Milk Bureau Certificate" class="w-full" />
		</div>
		<button
			class="btn border-2 border-base-content font-bureau tracking-wide uppercase btn-sm"
			onclick={download}
		>
			Download Certificate
		</button>
	{:else}
		<button
			class="btn border-2 border-base-content font-bureau tracking-wide uppercase btn-sm"
			onclick={generate}
			disabled={generating}
		>
			{generating ? 'Generating...' : 'Generate Certificate'}
		</button>
	{/if}
</div>
