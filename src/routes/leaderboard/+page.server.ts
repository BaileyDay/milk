import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const { data, error } = await supabase
		.from('leaderboard')
		.select('id, username, score, tier_name, created_at')
		.order('score', { ascending: false })
		.order('created_at', { ascending: true })
		.limit(100);

	return {
		entries: error ? [] : (data ?? []),
		loadFailed: Boolean(error)
	};
};
