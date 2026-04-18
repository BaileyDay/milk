import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
	if (!_supabase) {
		_supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
	}
	return _supabase;
}

export function getSupabaseAdmin(): SupabaseClient {
	if (!_supabaseAdmin) {
		_supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
			auth: { persistSession: false, autoRefreshToken: false }
		});
	}
	return _supabaseAdmin;
}

export const supabase = new Proxy({} as SupabaseClient, {
	get(_target, prop) {
		const client = getSupabase() as unknown as Record<string | symbol, unknown>;
		return client[prop as string];
	}
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
	get(_target, prop) {
		const client = getSupabaseAdmin() as unknown as Record<string | symbol, unknown>;
		return client[prop as string];
	}
});
