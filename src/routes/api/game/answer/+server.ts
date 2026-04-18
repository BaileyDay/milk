import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { submitAnswer } from '$lib/server/game-sessions';
import { rateLimit } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	if (!rateLimit(`answer:${ip}`, 120, 60_000)) {
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
	const answer =
		body && typeof body === 'object' && 'answer' in body
			? (body as { answer: unknown }).answer
			: null;

	if (typeof sessionId !== 'string') {
		return json({ error: 'sessionId required' }, { status: 400 });
	}

	let typedAnswer: boolean | 'timeout';
	if (answer === 'timeout') {
		typedAnswer = 'timeout';
	} else if (typeof answer === 'boolean') {
		typedAnswer = answer;
	} else {
		return json({ error: 'answer must be boolean or "timeout"' }, { status: 400 });
	}

	const result = await submitAnswer(sessionId, typedAnswer);
	if ('error' in result) {
		return json({ error: result.error }, { status: 400 });
	}
	return json(result);
};
