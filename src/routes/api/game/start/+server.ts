import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { startSession } from '$lib/server/game-sessions';
import { rateLimit } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ getClientAddress, platform }) => {
	const ip = getClientAddress();
	if (!(await rateLimit(platform?.env?.RATE_LIMITS, `start:${ip}`, 10, 60_000))) {
		return json({ error: 'Too many requests' }, { status: 429 });
	}
	try {
		const result = await startSession(platform?.env?.GAME_SESSIONS);
		return json(result);
	} catch (err) {
		console.error('start session failed', err);
		return json({ error: 'Failed to start game' }, { status: 500 });
	}
};
