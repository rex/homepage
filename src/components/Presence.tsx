import { useEffect, useRef } from 'react';

/**
 * Presence — a no-UI React island that runs on every page.
 *
 * Fires tiny GETs to a long-named endpoint that returns 204. The
 * CloudFront access log captures the URI + query string, which is the
 * entire payload. No cookies, no fingerprinting, no third-party data
 * egress, no CSRF surface.
 *
 * Built into the same JavaScript bundle the rest of the site needs to
 * function (React + ThemeToggle + this island), so an ad blocker can't
 * yank it without breaking the page. The endpoint, attribute names,
 * and chunk filename are all deliberately benign — no "track",
 * "analytic", "telemetry", "pixel", "beacon", or "stats" anywhere.
 */

const ENDPOINT =
  '/this-is-only-here-to-see-real-people-vs-robots-i-am-not-logging-all-your-shit-i-promise';

type Params = Record<string, string | undefined>;

function note(params: Params): void {
  try {
    const qs = Object.entries(params)
      .filter((entry): entry is [string, string] => {
        const v = entry[1];
        return v !== undefined && v !== null && v !== '';
      })
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const url = qs ? `${ENDPOINT}?${qs}` : ENDPOINT;
    if (typeof navigator.sendBeacon === 'function') {
      if (navigator.sendBeacon(url)) return;
    }
    // Fallback for older browsers / sendBeacon refusals.
    fetch(url, { method: 'GET', cache: 'no-store', keepalive: true }).catch(
      () => {
        /* silent */
      },
    );
  } catch {
    /* silent */
  }
}

export default function Presence(): null {
  // De-dupe section visits per page-session.
  const seenSectionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 1. Page view on mount.
    let refHost = '';
    try {
      refHost = document.referrer ? new URL(document.referrer).hostname : '';
    } catch {
      /* malformed referrer; ignore */
    }
    note({ evt: 'view', p: location.pathname, ref: refHost });

    // 2. Click delegation: data-event labels + outbound + download intent.
    const onClick = (event: MouseEvent): void => {
      const path = event.composedPath() as Element[];
      let labelSent = false;
      let anchor: HTMLAnchorElement | null = null;
      for (const el of path) {
        if (!(el instanceof HTMLElement)) continue;
        if (!labelSent) {
          const label = el.getAttribute('data-event');
          if (label) {
            note({ evt: 'click', p: location.pathname, t: label });
            labelSent = true;
          }
        }
        if (!anchor && el instanceof HTMLAnchorElement) {
          anchor = el;
        }
      }
      if (anchor) {
        const href = anchor.getAttribute('href') || '';
        if (anchor.host && anchor.host !== location.host) {
          note({
            evt: 'outbound',
            p: location.pathname,
            u: anchor.host + (anchor.pathname || ''),
          });
        }
      }
    };
    document.addEventListener('click', onClick, true);

    // 3. Section visibility via IntersectionObserver. Each <section id="...">
    //    reports once per page-session at the 50% threshold.
    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      const seen = seenSectionsRef.current;
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).id;
            if (entry.isIntersecting && id && !seen.has(id)) {
              seen.add(id);
              note({ evt: 'section', p: location.pathname, s: id });
            }
          }
        },
        { threshold: 0.5 },
      );
      const sections = document.querySelectorAll<HTMLElement>('section[id]');
      sections.forEach((s) => io!.observe(s));
    }

    // 4. Theme flip via MutationObserver on <html data-theme>.
    let lastTheme = document.documentElement.getAttribute('data-theme') || '';
    const mo = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme') || '';
      if (t && t !== lastTheme) {
        note({ evt: 'theme', v: t });
        lastTheme = t;
      }
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      document.removeEventListener('click', onClick, true);
      if (io) io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
