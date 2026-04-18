<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);
	let formEl: HTMLFormElement | undefined = $state();
</script>

<svelte:head>
	<title>Admin — Milk Bureau</title>
</svelte:head>

<section class="mx-auto w-full max-w-xl px-4 py-8">
	<h1 class="mb-6 text-2xl font-bold tracking-wide uppercase">Admin — Upload image</h1>

	{#if form && 'success' in form && form.success}
		<div class="alert alert-success mb-4">
			<span>Uploaded.</span>
			<img src={form.src} alt="Uploaded preview" class="ml-auto h-16 w-16 object-cover" />
		</div>
	{/if}

	{#if form && 'message' in form && form.message}
		<div class="alert alert-error mb-4">
			<span>{form.message}</span>
		</div>
	{/if}

	<form
		bind:this={formEl}
		method="POST"
		action="?/upload"
		enctype="multipart/form-data"
		class="flex flex-col gap-4"
		use:enhance={() => {
			submitting = true;
			return async ({ result, update }) => {
				await update({ reset: false });
				if (result.type === 'success') {
					formEl?.reset();
				}
				submitting = false;
			};
		}}
	>
		<label class="form-control w-full">
			<span class="label-text mb-1">Image file</span>
			<input
				type="file"
				name="file"
				accept="image/*"
				required
				class="file-input file-input-bordered w-full"
			/>
		</label>

		<label class="form-control w-full">
			<span class="label-text mb-1">Alt text</span>
			<input
				type="text"
				name="alt"
				required
				class="input input-bordered w-full"
				placeholder="e.g. Whole milk carton on a kitchen counter"
			/>
		</label>

		<label class="form-control w-full">
			<span class="label-text mb-1">Tier (1–5)</span>
			<select name="tier" required class="select select-bordered w-full">
				<option value="" disabled selected>Select a tier…</option>
				<option value="1">1</option>
				<option value="2">2</option>
				<option value="3">3</option>
				<option value="4">4</option>
				<option value="5">5</option>
			</select>
		</label>

		<label class="form-control w-full">
			<span class="label-text mb-1">Explanation (optional)</span>
			<textarea
				name="explanation"
				rows="3"
				class="textarea textarea-bordered w-full"
				placeholder="Why this image is/isn't milk"
			></textarea>
		</label>

		<label class="flex items-center gap-2">
			<input type="checkbox" name="isMilk" class="checkbox" />
			<span>Is milk</span>
		</label>

		<label class="flex items-center gap-2">
			<input type="checkbox" name="enabled" class="checkbox" checked />
			<span>Enabled</span>
		</label>

		<button type="submit" class="btn btn-primary mt-2" disabled={submitting}>
			{submitting ? 'Uploading…' : 'Upload'}
		</button>
	</form>
</section>
