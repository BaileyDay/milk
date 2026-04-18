import type { KVNamespace } from '@cloudflare/workers-types';

interface Bucket {
	count: number;
	resetAt: number;
}

const memory = new Map<string, Bucket>();

export async function rateLimit(
	kv: KVNamespace | undefined,
	key: string,
	limit: number,
	windowMs: number
): Promise<boolean> {
	const now = Date.now();

	if (kv) {
		const raw = await kv.get(key);
		let bucket: Bucket | null = null;
		try {
			bucket = raw ? (JSON.parse(raw) as Bucket) : null;
		} catch {
			bucket = null;
		}
		if (!bucket || now >= bucket.resetAt) {
			const fresh: Bucket = { count: 1, resetAt: now + windowMs };
			await kv.put(key, JSON.stringify(fresh), {
				expirationTtl: Math.max(60, Math.ceil(windowMs / 1000))
			});
			return true;
		}
		if (bucket.count >= limit) return false;
		bucket.count++;
		await kv.put(key, JSON.stringify(bucket), {
			expirationTtl: Math.max(60, Math.ceil((bucket.resetAt - now) / 1000))
		});
		return true;
	}

	const existing = memory.get(key);
	if (!existing || now >= existing.resetAt) {
		memory.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}
	if (existing.count >= limit) return false;
	existing.count++;
	return true;
}
