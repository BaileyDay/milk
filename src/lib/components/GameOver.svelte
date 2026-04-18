<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import type { Tier } from '$lib/data/tiers';
	import Certificate from './Certificate.svelte';
	import Leaderboard from './Leaderboard.svelte';

	let {
		score,
		tier,
		sessionId,
		feedbackMessage,
		onPlayAgain
	}: {
		score: number;
		tier: Tier;
		sessionId: string;
		feedbackMessage: string;
		onPlayAgain: () => void;
	} = $props();

	let username = $state('');
	let showCertificate = $state(false);
	let submitting = $state(false);
	let submitted = $state(false);
	let submitError = $state('');
	let yourRank = $state<number | null>(null);

	interface LeaderboardEntry {
		id: string;
		username: string;
		score: number;
		tier_name: string;
		created_at: string;
	}

	let leaderboardEntries = $state<LeaderboardEntry[]>([]);
	let leaderboardLoading = $state(true);

	onMount(async () => {
		// Fire confetti regardless of score
		const confetti = (await import('canvas-confetti')).default;
		confetti({
			particleCount: 200,
			spread: 160,
			origin: { y: 0.6 }
		});
		setTimeout(() => {
			confetti({
				particleCount: 100,
				spread: 120,
				origin: { y: 0.4, x: 0.3 }
			});
			confetti({
				particleCount: 100,
				spread: 120,
				origin: { y: 0.4, x: 0.7 }
			});
		}, 400);

		// Fetch leaderboard
		await fetchLeaderboard();
	});

	async function fetchLeaderboard(forUsername?: string) {
		leaderboardLoading = true;
		try {
			const params = forUsername ? `?username=${encodeURIComponent(forUsername)}` : '';
			const res = await fetch(`/api/leaderboard${params}`);
			if (res.ok) {
				const data = await res.json();
				leaderboardEntries = data.entries;
				if (data.yourRank) yourRank = data.yourRank;
			}
		} catch {
			// Leaderboard fetch failed silently — not critical
		}
		leaderboardLoading = false;
	}

	async function submitScore() {
		if (!username.trim() || submitting || submitted) return;
		if (!sessionId) {
			submitError = 'Session expired — start a new game to submit.';
			return;
		}
		submitting = true;
		submitError = '';

		try {
			const res = await fetch('/api/game/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId,
					username: username.trim()
				})
			});

			if (res.ok) {
				const data = await res.json();
				yourRank = data.rank;
				submitted = true;
				await fetchLeaderboard(username.trim());
			} else {
				const data = await res.json().catch(() => ({}));
				submitError = data.error || 'Submission failed';
			}
		} catch {
			submitError = 'Network error — The Bureau is experiencing technical difficulties';
		}
		submitting = false;
	}
</script>

<div class="flex w-full max-w-md flex-col items-center gap-4" in:fly={{ y: 40, duration: 500 }}>
	<div class="w-full border-2 border-base-content bg-base-100 p-8 text-center">
		<p class="mb-2 font-bureau text-2xl tracking-widest text-error">EXAMINATION TERMINATED</p>
		<p class="mb-4 text-sm text-secondary">{feedbackMessage}</p>

		<div class="mb-4 border-t-2 border-base-content pt-4">
			<p class="text-[0.6rem] tracking-[0.15em] text-secondary uppercase">Final Score</p>
			<p class="font-bureau text-4xl">{score}</p>
			<p class="font-bureau text-sm text-primary">{tier.name}</p>
			<p class="mt-1 font-joke text-xs text-secondary/60 italic">{tier.description}</p>
		</div>

		<!-- Username + Submit -->
		<div class="mb-4">
			<label
				class="mb-1 block text-[0.6rem] tracking-[0.15em] text-secondary uppercase"
				for="username"
			>
				Enter Your Name For The Record
			</label>
			<div class="flex gap-2">
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="Agent Codename"
					maxlength={20}
					disabled={submitted}
					class="input-bordered input flex-1 border-2 border-base-content text-center font-bureau tracking-wide"
				/>
				{#if !submitted}
					<button
						class="btn border-2 border-base-content font-bureau text-xs tracking-wide uppercase btn-primary"
						onclick={submitScore}
						disabled={!username.trim() || submitting}
					>
						{submitting ? '...' : 'Submit'}
					</button>
				{/if}
			</div>
			{#if submitError}
				<p class="mt-1 text-xs text-error">{submitError}</p>
			{/if}
			{#if submitted && yourRank}
				<p class="mt-2 font-bureau text-sm text-primary">
					You are ranked #{yourRank}
				</p>
			{/if}
		</div>

		<!-- Certificate -->
		{#if username.trim()}
			{#if !showCertificate}
				<button
					class="btn mb-3 font-bureau text-xs tracking-wide text-secondary uppercase btn-ghost btn-sm"
					onclick={() => (showCertificate = true)}
				>
					Generate Official Certificate
				</button>
			{:else}
				<div class="mb-4">
					<Certificate {username} {score} {tier} />
				</div>
			{/if}
		{/if}

		<!-- Actions -->
		<div class="flex flex-col gap-2">
			<button
				class="btn border-2 border-base-content font-bureau tracking-widest uppercase btn-primary"
				onclick={onPlayAgain}
			>
				Request Re-Examination
			</button>
			<a href="/" class="btn font-bureau text-xs tracking-wide text-secondary uppercase btn-ghost">
				Return to Bureau Lobby
			</a>
		</div>

		<!-- Discord link placeholder -->
		<div class="mt-4 border-t border-base-300 pt-3">
			<p class="mb-1 text-[0.5rem] tracking-[0.1em] text-secondary/50 uppercase">
				Join the Bureau's unofficial channel
			</p>
			<p class="font-joke text-xs text-primary">Discord Invite (link TBD)</p>
		</div>
	</div>

	<!-- Leaderboard -->
	<Leaderboard entries={leaderboardEntries} {yourRank} loading={leaderboardLoading} />
</div>
