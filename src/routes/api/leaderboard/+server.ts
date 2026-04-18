import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ url }) => {
	const username = url.searchParams.get('username');

	const { data: entries, error } = await supabase
		.from('leaderboard')
		.select('id, username, score, tier_name, created_at')
		.order('score', { ascending: false })
		.order('created_at', { ascending: true })
		.limit(100);

	if (error) {
		return json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
	}

	let yourRank: number | null = null;

	if (username) {
		const { data: userEntry } = await supabase
			.from('leaderboard')
			.select('score')
			.eq('username', username)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (userEntry) {
			const { count: higherCount } = await supabase
				.from('leaderboard')
				.select('*', { count: 'exact', head: true })
				.gt('score', userEntry.score);

			yourRank = (higherCount ?? 0) + 1;
		}
	}

	return json({ entries: entries ?? [], yourRank });
};
