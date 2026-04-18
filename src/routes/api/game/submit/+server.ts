import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { submitFinal } from '$lib/server/game-sessions';
import { rateLimit } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	if (!rateLimit(`submit:${ip}`, 10, 60_000)) {
		return json({ error: 'Too many requests' }, { status: 429 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const sessionId =
		body && typeof body === 'object' && 'sessionId' in body
			? (body as { sessionId: unknown }).sessionId
			: null;
	const username =
		body && typeof body === 'object' && 'username' in body
			? (body as { username: unknown }).username
			: null;

	if (typeof sessionId !== 'string') {
		return json({ error: 'sessionId required' }, { status: 400 });
	}
	if (typeof username !== 'string') {
		return json({ error: 'username required' }, { status: 400 });
	}

	const result = await submitFinal(sessionId, username);
	if ('error' in result) {
		return json({ error: result.error }, { status: 400 });
	}
	return json(result);
};
