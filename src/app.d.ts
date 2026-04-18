// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { KVNamespace } from '@cloudflare/workers-types';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				ADMIN_TOKENS?: KVNamespace;
				RATE_LIMITS?: KVNamespace;
				GAME_SESSIONS?: KVNamespace;
			};
		}
	}
}

export {};
