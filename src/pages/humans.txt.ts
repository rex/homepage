import type { APIRoute } from 'astro';
import { loadContact } from '../lib/content';
import { buildDateShort } from '../lib/build-info';

export const GET: APIRoute = async () => {
  const contact = await loadContact();
  const body = contact.humans_txt.replace('__BUILD_DATE__', buildDateShort());
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
