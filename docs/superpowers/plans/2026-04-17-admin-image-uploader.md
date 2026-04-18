# Admin Image Uploader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only `/admin` page that uploads one image to Cloudflare R2 and inserts a matching row in the Supabase `images` table.

**Architecture:** SvelteKit route with one form action. The page (`+page.svelte`) submits `multipart/form-data` to the `upload` action in `+page.server.ts`; the action calls the existing `uploadToR2` helper, then inserts into Supabase. No auth, no listing, no validation, no transforms. Not deployed.

**Tech Stack:** SvelteKit 2 (Svelte 5), TypeScript, `@aws-sdk/client-s3` (via `src/lib/server/r2.ts`), `@supabase/supabase-js` (via `src/lib/server/supabase.ts`), Tailwind v4 + daisyUI for styling.

**Testing note:** This project has no test framework installed (no vitest/jest in `package.json`) and the spec mandates manual testing only. Each task therefore verifies via `npm run check` (type check) and a manual smoke step instead of automated tests. The project is not a git repository, so there are no commit steps.

**Spec:** `docs/superpowers/specs/2026-04-17-admin-image-uploader-design.md`

---

## Task 1: Create the server action

**Files:**
- Create: `src/routes/admin/+page.server.ts`

- [ ] **Step 1: Create the file**

Create `src/routes/admin/+page.server.ts` with the following contents:

```ts
import { fail, type Actions } from '@sveltejs/kit';
import { uploadToR2 } from '$lib/server/r2';
import { supabase } from '$lib/server/supabase';

function getExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');
	return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

export const actions: Actions = {
	upload: async ({ request }) => {
		const data = await request.formData();

		const file = data.get('file');
		const tierRaw = data.get('tier');
		const alt = data.get('alt');
		const explanationRaw = data.get('explanation');
		const isMilk = data.get('isMilk') === 'on';
		const enabled = data.get('enabled') === 'on';

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'File is required' });
		}
		if (typeof tierRaw !== 'string' || !['1', '2', '3', '4', '5'].includes(tierRaw)) {
			return fail(400, { message: 'Tier must be 1–5' });
		}
		if (typeof alt !== 'string' || alt.trim() === '') {
			return fail(400, { message: 'Alt text is required' });
		}

		const tier = Number(tierRaw) as 1 | 2 | 3 | 4 | 5;
		const explanation =
			typeof explanationRaw === 'string' && explanationRaw.trim() !== ''
				? explanationRaw
				: null;

		const key = `tier-${tier}/${crypto.randomUUID()}${getExtension(file.name)}`;

		let src: string;
		try {
			const buf = Buffer.from(await file.arrayBuffer());
			src = await uploadToR2(key, buf, file.type || 'application/octet-stream');
		} catch (err) {
			console.error('R2 upload failed', err);
			return fail(500, { message: 'R2 upload failed' });
		}

		const { error } = await supabase.from('images').insert({
			src,
			is_milk: isMilk,
			tier,
			alt,
			explanation,
			enabled
		});

		if (error) {
			console.error('Supabase insert failed', error);
			return fail(500, { message: 'DB insert failed' });
		}

		return { success: true as const, src };
	}
};
```

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: Exits 0 with no errors in `src/routes/admin/+page.server.ts`. (Pre-existing warnings elsewhere in the repo are fine; new file must be clean.)

If the check reports a missing `./$types` import, it's a stale svelte-kit sync. Run `npm run prepare` and re-check.

---

## Task 2: Create the form UI

**Files:**
- Create: `src/routes/admin/+page.svelte`

- [ ] **Step 1: Create the file**

Create `src/routes/admin/+page.svelte` with the following contents:

```svelte
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
```

- [ ] **Step 2: Run svelte-autofixer**

Use the `svelte-autofixer` MCP tool on the file contents. Apply any fixes it returns and re-run until it reports no issues.

- [ ] **Step 3: Type-check**

Run: `npm run check`
Expected: Exits 0 with no new errors in `src/routes/admin/`.

---

## Task 3: Fill R2 credentials and smoke-test end-to-end

**Files:**
- Modify: `.env` (local only; do not commit — there is no git repo anyway)

- [ ] **Step 1: Populate R2 env vars**

The admin page cannot reach R2 until these are filled in `.env`:

```
R2_ACCESS_KEY_ID=<your key id>
R2_SECRET_ACCESS_KEY=<your secret>
R2_BUCKET_NAME=<your bucket>
R2_PUBLIC_URL=<public URL base, no trailing slash>
```

`R2_ACCOUNT_ID` and the Supabase vars are already set. Ask the user for the missing values if they are not present.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev`
Expected: server starts on the printed localhost port.

- [ ] **Step 3: Upload one image per tier**

In a browser, visit `http://localhost:<port>/admin` and upload one image for each of tiers 1–5. For each:

1. Pick the file, set alt text, tier, and the `isMilk` / `enabled` checkboxes.
2. Submit.
3. Confirm the green "Uploaded." alert appears with a preview thumbnail.
4. Confirm the form fields are cleared afterward.

Expected after all five: five objects in R2 under `tier-1/<uuid>.<ext>` … `tier-5/<uuid>.<ext>`, and five rows in the `images` table with matching metadata.

- [ ] **Step 4: Verify the public API returns them**

In a browser, visit `http://localhost:<port>/api/images`.
Expected: JSON response containing the five new rows (because `enabled = true`).

- [ ] **Step 5: Verify the error path**

Temporarily change `SUPABASE_ANON_KEY` in `.env` to an invalid value and restart dev. Attempt an upload.
Expected: red "DB insert failed" alert renders. Restore the correct key afterward.

---

## Done criteria

- `/admin` renders the form.
- Submitting a valid form creates an R2 object under `tier-N/<uuid>.<ext>` and a row in `images` whose `src` is the returned public URL.
- Success path shows the preview and clears the form.
- Failure path shows an inline error message.
- `npm run check` passes with no new errors in `src/routes/admin/`.