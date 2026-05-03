import { version } from '../../package.json';
export const PACKAGE_VERSION: string = version;

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

export function buildDateTimeCST(): string {
  const d = new Date(BUILD_DATE);
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  const tz = isChicagoDST(d) ? 'CDT' : 'CST';
  return `${date} ${time} ${tz}`;
}

function isChicagoDST(d: Date): boolean {
  const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
  const stdOffset = Math.max(jan, jul);
  return d.getTimezoneOffset() < stdOffset;
}

export function securityExpiresIso(): string {
  const d = new Date(BUILD_DATE);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().replace(/\.\d+Z$/, 'Z');
}
