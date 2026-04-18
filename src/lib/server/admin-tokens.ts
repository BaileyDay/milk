import type { KVNamespace } from '@cloudflare/workers-types';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const KV_PREFIX = 'admin:';

const memory = {
	tokens: new Map<string, number>()
};

function sweepMemory() {
	const now = Date.now();
	for (const [token, exp] of memory.tokens) {
		if (exp < now) memory.tokens.delete(token);
	}
}

export async function issueToken(kv?: KVNamespace): Promise<string> {
	const token = crypto.randomUUID();
	if (kv) {
		await kv.put(KV_PREFIX + token, '1', { expirationTtl: TOKEN_TTL_SECONDS });
	} else {
		sweepMemory();
		memory.tokens.set(token, Date.now() + TOKEN_TTL_SECONDS * 1000);
	}
	return token;
}

export async function isValidToken(
	kv: KVNamespace | undefined,
	token: string | undefined
): Promise<boolean> {
	if (!token) return false;
	if (kv) {
		return (await kv.get(KV_PREFIX + token)) !== null;
	}
	sweepMemory();
	return memory.tokens.has(token);
}

export async function revokeToken(kv: KVNamespace | undefined, token: string): Promise<void> {
	if (kv) {
		await kv.delete(KV_PREFIX + token);
	} else {
		memory.tokens.delete(token);
	}
}

export const TOKEN_COOKIE_MAX_AGE = TOKEN_TTL_SECONDS;
