import type { RequestHandler } from './$types';

export const config = { maxDuration: 60 };

export const GET: RequestHandler = async ({ fetch, url }) => {
	console.log('[artisanal] Cache warm triggered');

	const origin = url.origin;
	const res = await fetch(origin);

	console.log(`[artisanal] Warmed cache, status: ${res.status}`);

	return new Response(JSON.stringify({ warmed: true, status: res.status }), {
		headers: { 'content-type': 'application/json' }
	});
};
