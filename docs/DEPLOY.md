# Deploying to Cloudflare Workers

This app is configured for Cloudflare Workers via `@sveltejs/adapter-cloudflare`.

## One-time setup

### 1. Install wrangler and log in

```bash
npx wrangler login
```

### 2. Create the three KV namespaces

```bash
npx wrangler kv namespace create ADMIN_TOKENS
npx wrangler kv namespace create RATE_LIMITS
npx wrangler kv namespace create GAME_SESSIONS
```

Each command prints an `id` like `abcd1234...`. Paste each one into `wrangler.jsonc`, replacing the `REPLACE_WITH_KV_ID` placeholders for the matching binding.

### 3. Set production secrets

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put R2_PUBLIC_URL
```

Each prompt accepts the value from your local `.env`.

### 4. Local `wrangler dev` secrets

Copy `.dev.vars.example` to `.dev.vars` and paste the same values. `.dev.vars` is gitignored.

(For `npm run dev` via vite, SvelteKit reads `.env` directly — no extra step.)

## Deploy

```bash
npm run deploy
```

This runs `npm run build` and then `wrangler deploy`. The first deploy prints the Workers.dev URL; you can attach a custom domain in the Cloudflare dashboard.

## Local Workers-runtime testing

```bash
npm run wrangler:dev
```

Runs the app under miniflare with real KV bindings, identical to production. Slower to iterate than `npm run dev` but catches Cloudflare-specific issues.

## Troubleshooting

- **"KV binding not found"**: confirm each `id` in `wrangler.jsonc` matches the IDs printed by `wrangler kv namespace create`.
- **Cookies not set in production**: the login endpoint uses `secure: !dev`, so cookies require HTTPS. Workers.dev URLs are HTTPS — this shouldn't bite you there.
- **Supabase writes fail on production**: `SUPABASE_SECRET_KEY` must be the `sb_secret_*` key (not `sb_publishable_*`) and RLS must be enabled on the `images` and `leaderboard` tables.
- **In-memory fallback instead of KV**: if KV bindings aren't wired, the server silently falls back to in-memory stores (fine for local dev, not safe for multi-instance production). Check that `platform.env.ADMIN_TOKENS` etc. is populated by adding a `console.log` in the hook.
