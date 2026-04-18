import { fail, type Actions } from '@sveltejs/kit';
import { uploadToR2 } from '$lib/server/r2';
import { supabaseAdmin } from '$lib/server/supabase';

function getExtension(filename: string): string {
	const dot = filename.lastIndexOf('.');
	return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

export const actions: Actions = {
	upload: async ({ request }) => {
		const data = await request.formData();

		const file = data.get('file');
		const tierRaw = data.get('tier');
		const alt = data.get('alt');
		const explanationRaw = data.get('explanation');
		const isMilk = data.get('isMilk') === 'on';
		const enabled = data.get('enabled') === 'on';

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'File is required' });
		}
		if (typeof tierRaw !== 'string' || !['1', '2', '3', '4', '5'].includes(tierRaw)) {
			return fail(400, { message: 'Tier must be 1–5' });
		}
		if (typeof alt !== 'string' || alt.trim() === '') {
			return fail(400, { message: 'Alt text is required' });
		}

		const tier = Number(tierRaw) as 1 | 2 | 3 | 4 | 5;
		const explanation =
			typeof explanationRaw === 'string' && explanationRaw.trim() !== ''
				? explanationRaw
				: null;

		const id = crypto.randomUUID();
		const key = `tier-${tier}/${id}${getExtension(file.name)}`;

		let src: string;
		try {
			const buf = Buffer.from(await file.arrayBuffer());
			src = await uploadToR2(key, buf, file.type || 'application/octet-stream');
		} catch (err) {
			console.error('R2 upload failed', err);
			return fail(500, { message: 'R2 upload failed' });
		}

		const { error } = await supabaseAdmin.from('images').insert({
			id,
			src,
			is_milk: isMilk,
			tier,
			alt,
			explanation,
			enabled
		});

		if (error) {
			console.error('Supabase insert failed', error);
			return fail(500, { message: 'DB insert failed' });
		}

		return { success: true as const, src };
	}
};
