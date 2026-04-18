import { redirect, type Handle } from '@sveltejs/kit';
import { isValidToken } from '$lib/server/admin-tokens';

const ADMIN_COOKIE = 'milk_admin';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');
	const isLogin = pathname === '/admin/login';

	if (isAdminArea && !isLogin) {
		const token = event.cookies.get(ADMIN_COOKIE);
		if (!(await isValidToken(event.platform?.env?.ADMIN_TOKENS, token))) {
			throw redirect(303, '/admin/login');
		}
	}

	return resolve(event);
};
