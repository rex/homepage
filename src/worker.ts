/// <reference types="@cloudflare/workers-types" />

/**
 * Worker entry. Two responsibilities:
 *   1. Handle vanity-domain 301 redirects (piercemoore.cv, .dev) inline.
 *      No Bulk Redirects rule in the Cloudflare dashboard — the policy
 *      lives in code so it ships with the build.
 *   2. Stub POST /api/ask with a 501 to reserve the route for v2.
 *
 * Everything else falls through to env.ASSETS.fetch — pure static.
 * `assets.not_found_handling: "404-page"` in wrangler.jsonc makes the
 * ASSETS fetcher serve dist/404.html for unknown paths automatically.
 */

interface Env {
  ASSETS: Fetcher;
}

const CV_REDIRECT = 'https://piercemoore.com/cv';
const DEV_REDIRECT = 'https://piercemoore.com/writing';

const askNotImplemented = (): Response =>
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

const askMethodNotAllowed = (): Response =>
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host === 'piercemoore.cv' || host === 'www.piercemoore.cv') {
      return Response.redirect(CV_REDIRECT, 301);
    }
    if (host === 'piercemoore.dev' || host === 'www.piercemoore.dev') {
      return Response.redirect(DEV_REDIRECT, 301);
    }

    if (url.pathname === '/api/ask') {
      return request.method === 'POST' ? askNotImplemented() : askMethodNotAllowed();
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
