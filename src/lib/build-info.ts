export const BUILD_COMMIT: string =
  import.meta.env.VITE_BUILD_COMMIT || 'dev';

export const BUILD_DATE: string =
  import.meta.env.VITE_BUILD_DATE || new Date().toISOString();

export function buildDateShort(): string {
  const d = new Date(BUILD_DATE);
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function securityExpiresIso(): string {
  const d = new Date(BUILD_DATE);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().replace(/\.\d+Z$/, 'Z');
}
