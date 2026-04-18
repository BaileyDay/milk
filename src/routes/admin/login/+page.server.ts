import { fail, redirect, type Actions } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { issueToken, TOKEN_COOKIE_MAX_AGE } from '$lib/server/admin-tokens';

const ADMIN_COOKIE = 'milk_admin';

export const actions: Actions = {
	default: async ({ request, cookies, platform }) => {
		const data = await request.formData();
		const password = data.get('password');

		if (typeof password !== 'string' || password !== env.ADMIN_PASSWORD) {
			return fail(401, { message: 'Incorrect password' });
		}

		const token = await issueToken(platform?.env?.ADMIN_TOKENS);

		cookies.set(ADMIN_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: !dev,
			maxAge: TOKEN_COOKIE_MAX_AGE
		});

		throw redirect(303, '/admin');
	}
};
