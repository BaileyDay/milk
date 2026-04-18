import { fail, redirect, type Actions } from '@sveltejs/kit';
import { ADMIN_PASSWORD } from '$env/static/private';
import { issueToken, TOKEN_COOKIE_MAX_AGE } from '$lib/server/admin-tokens';

const ADMIN_COOKIE = 'milk_admin';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password');

		if (typeof password !== 'string' || password !== ADMIN_PASSWORD) {
			return fail(401, { message: 'Incorrect password' });
		}

		const token = issueToken();

		cookies.set(ADMIN_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: TOKEN_COOKIE_MAX_AGE
		});

		throw redirect(303, '/admin');
	}
};
