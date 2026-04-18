<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Admin Login — Milk Bureau</title>
</svelte:head>

<section class="mx-auto flex w-full max-w-sm flex-col gap-4 px-4 py-16">
	<h1 class="font-bureau text-xl tracking-widest uppercase">Bureau Access Control</h1>
	<p class="text-xs tracking-wide text-secondary uppercase">Restricted Personnel Only</p>

	{#if form?.message}
		<div class="alert alert-error text-sm">{form.message}</div>
	{/if}

	<form
		method="POST"
		class="flex flex-col gap-3"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input
			type="password"
			name="password"
			autocomplete="current-password"
			required
			class="input input-bordered border-2 border-base-content font-bureau tracking-wider"
			placeholder="Clearance Code"
		/>
		<button type="submit" class="btn border-2 border-base-content btn-primary" disabled={submitting}>
			{submitting ? 'Verifying…' : 'Authenticate'}
		</button>
	</form>
</section>
