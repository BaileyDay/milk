const tokens = new Set<string>();
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const expiries = new Map<string, number>();

function sweep() {
	const now = Date.now();
	for (const [token, exp] of expiries) {
		if (exp < now) {
			tokens.delete(token);
			expiries.delete(token);
		}
	}
}

export function issueToken(): string {
	sweep();
	const token = crypto.randomUUID();
	tokens.add(token);
	expiries.set(token, Date.now() + TOKEN_TTL_MS);
	return token;
}

export function isValidToken(token: string | undefined): boolean {
	if (!token) return false;
	sweep();
	return tokens.has(token);
}

export function revokeToken(token: string) {
	tokens.delete(token);
	expiries.delete(token);
}

export const TOKEN_COOKIE_MAX_AGE = TOKEN_TTL_MS / 1000;
