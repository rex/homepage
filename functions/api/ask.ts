/**
 * Cloudflare Pages Function — keeps the Astro build pure-static while
 * still reserving POST /api/ask for v2.
 */
export const onRequestPost = () =>
  new Response(
    JSON.stringify({ status: 'not_implemented', note: 'v2 — query interface' }),
    {
      status: 501,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );

export const onRequest = () =>
  new Response(
    JSON.stringify({ status: 'method_not_allowed', allow: 'POST' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Allow: 'POST',
      },
    },
  );
