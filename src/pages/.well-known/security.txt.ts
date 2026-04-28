import type { APIRoute } from 'astro';
import { loadContact } from '../../lib/content';
import { securityExpiresIso } from '../../lib/build-info';

export const GET: APIRoute = async () => {
  const contact = await loadContact();
  const body = contact.security_txt.replace('__SECURITY_EXPIRES__', securityExpiresIso());
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
