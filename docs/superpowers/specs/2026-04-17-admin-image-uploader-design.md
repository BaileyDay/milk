# Admin image uploader — design

## Purpose

A local-only admin page at `/admin` for seeding the `images` table used by the Milk
Bureau game. Each submission uploads one image to Cloudflare R2 and inserts a
matching row in Supabase. Not deployed; used only while building out the game
catalog.

## Scope

In scope:

- Single-image upload with metadata.
- Insert into Supabase `images` table with `src` set to the R2 public URL.

Out of scope:

- Authentication (local-only tool, not deployed).
- Listing, editing, toggling, or deleting existing images.
- Batch uploads.
- Image validation (type/size) or transforms (WebP, resize).
- Navigation entry for the admin page; it is reachable only by typing `/admin`.

## Files

- `src/routes/admin/+page.svelte` — form UI.
- `src/routes/admin/+page.server.ts` — named form action `upload`.

No changes to `src/lib/server/r2.ts`, `src/lib/server/supabase.ts`, or the
existing `/api/images` route.

## Form fields

| Field         | Input                                     | Required | Default     |
| ------------- | ----------------------------------------- | -------- | ----------- |
| `file`        | `<input type="file" accept="image/*">`    | yes      | —           |
| `isMilk`      | checkbox                                  | no       | unchecked   |
| `tier`        | `<select>` with options 1–5               | yes      | —           |
| `alt`         | text                                      | yes      | —           |
| `explanation` | textarea                                  | no       | empty       |
| `enabled`     | checkbox                                  | no       | checked     |

## Action flow (`upload` in `+page.server.ts`)

1. `const data = await request.formData()` and extract fields.
2. Derive the extension from `file.name` (e.g. `.jpg`, `.png`). If no extension,
   fall back to empty string.
3. Build the R2 key: `tier-${tier}/${crypto.randomUUID()}${ext}`.
4. `const buf = Buffer.from(await file.arrayBuffer())`.
5. `const src = await uploadToR2(key, buf, file.type)`.
6. `await supabase.from('images').insert({ src, is_milk, tier, alt, explanation: explanation || null, enabled })`.
7. On Supabase error, return `fail(500, { message: 'DB insert failed' })`.
   On R2 error (caught via try/catch around step 5), return
   `fail(500, { message: 'R2 upload failed' })`.
8. On success, return `{ success: true, src }`.

Column mapping matches the existing snake_case schema in
`src/routes/api/images/+server.ts` (`is_milk`, `tier`, `alt`, `explanation`,
`enabled`).

## UI behavior

- Form posts to the `upload` action (`<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance>`).
- `use:enhance` — on success, reset the form (clear all fields) and show a small
  preview of the uploaded image using `form.src`.
- On failure, show `form.message` inline above the submit button.
- Submit button is disabled while submitting.

## Data flow

```
browser form
   │ multipart/form-data (file + fields)
   ▼
+page.server.ts upload action
   │ Buffer + contentType + key
   ▼
uploadToR2() ── PutObject ──► R2 bucket (tier-N/<uuid>.<ext>)
   │ returns public URL
   ▼
supabase.from('images').insert(...) ──► images row
   │
   ▼
return { success, src } ──► form UI (preview + reset)
```

## Error handling

- R2 failure: caught; action returns `fail(500, { message })`. No DB row is
  written.
- Supabase failure: returned via `fail(500, { message })`. The R2 object is
  left in place (orphan). Acceptable for a local tool; cleanup is manual.
- Missing required fields: the browser blocks submission via `required`
  attributes; the server does not duplicate the check.

## Testing

Manual only (local-only tool, single-user). Test plan:

1. Fill the R2 env vars in `.env` and restart dev.
2. Upload one image per tier (1–5); verify each appears in the R2 bucket
   under `tier-N/<uuid>.<ext>` and in the `images` table with matching
   metadata.
3. Confirm `GET /api/images` returns the new rows (once `enabled = true`).
4. Confirm the form clears after success and shows the preview.
5. Temporarily break the Supabase key to verify the error path renders the
   inline message.

## Preconditions

The R2 credentials in `.env` are blank. Before this page is usable, fill:

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

This is an operational step, not part of the implementation.