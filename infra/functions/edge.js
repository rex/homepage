/**
 * CloudFront viewer-request function for piercemoore.com.
 *
 * Runtime: cloudfront-js-2.0 (ECMAScript 5.1+ with select ES6/ES2020 features).
 * No async/await, no fetch, no external imports. 10KB code limit. ~1ms budget.
 *
 * Responsibilities, in order:
 *   1. Vanity-domain 301 redirects:
 *        piercemoore.cv  -> piercemoore.com/cv
 *        piercemoore.dev -> piercemoore.com/writing
 *   2. www -> apex 301 redirect (canonical URL).
 *   3. POST /api/ask -> 501 JSON; other methods -> 405. The /api/ask path
 *      is reserved for v2 - this stub keeps the route claimed.
 *   4. First-party beacon endpoint
 *      (/this-is-only-here-to-see-real-people-vs-robots-i-am-not-logging-all-your-shit-i-promise).
 *      Returns 204; the CloudFront access log captures the query string,
 *      which is the entire payload (event type, page, target, etc.).
 *   5. /resume.pdf bot gate. Rewrites bot/non-browser requests to the
 *      /resume-fallback/ page so false-positive humans see a useful
 *      contact card instead of a hard 403.
 *   6. /admin/* HTTP Basic Auth gate. The expected header value is
 *      injected at synth time from the PIERCEMOORE_ADMIN_AUTH env var
 *      (or computed from PIERCEMOORE_ADMIN_USER + PIERCEMOORE_ADMIN_PASS).
 *      If the env var is unset, the placeholder remains and the gate
 *      returns 503 for every /admin/* request - admin is locked by
 *      default, you have to opt in by setting the env var at deploy.
 *   7. Clean-URL rewriting so /cv -> /cv/index.html for the S3 origin.
 */

// __ADMIN_AUTH__ is replaced at CDK synth time. If left as the literal
// placeholder string, the admin gate stays closed (503).
var ADMIN_AUTH = '__ADMIN_AUTH__';

function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var host = (headers.host && headers.host.value ? headers.host.value : '').toLowerCase();
  var uri = request.uri;

  // 1. Vanity-domain redirects.
  if (host === 'piercemoore.cv' || host === 'www.piercemoore.cv') {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { 'location': { value: 'https://piercemoore.com/cv' } }
    };
  }
  if (host === 'piercemoore.dev' || host === 'www.piercemoore.dev') {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { 'location': { value: 'https://piercemoore.com/writing' } }
    };
  }

  // 2. www.piercemoore.com -> piercemoore.com (preserve path + query).
  if (host === 'www.piercemoore.com') {
    var qs = '';
    if (request.querystring) {
      for (var key in request.querystring) {
        var entry = request.querystring[key];
        if (entry && entry.value !== undefined) {
          qs += (qs ? '&' : '?') + key + '=' + encodeURIComponent(entry.value);
        }
      }
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { 'location': { value: 'https://piercemoore.com' + uri + qs } }
    };
  }

  // 3. /api/ask - reserved for v2. Returns 501 on POST, 405 otherwise.
  if (uri === '/api/ask') {
    if (request.method === 'POST') {
      return {
        statusCode: 501,
        statusDescription: 'Not Implemented',
        headers: {
          'content-type': { value: 'application/json; charset=utf-8' },
          'cache-control': { value: 'no-store' }
        },
        body: '{"status":"not_implemented","note":"v2 - query interface"}'
      };
    }
    return {
      statusCode: 405,
      statusDescription: 'Method Not Allowed',
      headers: {
        'allow': { value: 'POST' },
        'content-type': { value: 'application/json; charset=utf-8' }
      },
      body: '{"status":"method_not_allowed","allow":"POST"}'
    };
  }

  // 4. First-party beacon endpoint. Pierce explicitly named the path
  //    so it's both un-misleading-about-its-purpose AND unlikely to
  //    trigger ad blockers (no "track", "analytics", "_p", etc.).
  //    Returns 204 No Content. The CloudFront access log captures the
  //    URI + query string, which is the entire payload.
  //    See `analytics.yml` for how this is parsed.
  if (uri === '/this-is-only-here-to-see-real-people-vs-robots-i-am-not-logging-all-your-shit-i-promise') {
    return {
      statusCode: 204,
      statusDescription: 'No Content',
      headers: {
        'cache-control': { value: 'no-store' },
        'x-real-people-only': { value: 'yes-i-promise' }
      }
    };
  }

  // 5. /resume.pdf bot gate. Rewrites the request URI to a friendly
  //    fallback page (contact info + vCard QR) instead of returning
  //    a hard 403. False-positive humans (corporate proxies stripping
  //    UA, weird browsers, etc.) get a useful page with email + QR
  //    code. Real bots get the same page - which is fine, the content
  //    is public and points them at email anyway.
  //
  //    Bots reach the fallback page (status 200, /resume-fallback/...)
  //    instead of /resume.pdf. The analytics workflow counts hits to
  //    the fallback path as "blocked_bots" and 200/206 to /resume.pdf
  //    as real downloads.
  if (uri === '/resume.pdf') {
    var ua = '';
    if (request.headers['user-agent'] && request.headers['user-agent'].value) {
      ua = request.headers['user-agent'].value.toLowerCase();
    }
    var botSignals = [
      'bot', 'crawl', 'spider', 'scrape', 'fetch', 'slurp',
      'archive.org', 'wayback', 'preview', 'whatsapp', 'telegram',
      'discord', 'slack', 'embedly', 'link-checker', 'feedly',
      'curl', 'wget', 'python-requests', 'python-urllib', 'urllib',
      'go-http-client', 'java/', 'okhttp', 'libwww', 'lwp',
      'requests/', 'axios', 'node-fetch', 'httpx', 'aiohttp',
      'headless', 'phantom', 'puppeteer', 'playwright', 'selenium', 'scrapy'
    ];
    var isBot = !ua;
    if (!isBot) {
      for (var i = 0; i < botSignals.length; i++) {
        if (ua.indexOf(botSignals[i]) !== -1) {
          isBot = true;
          break;
        }
      }
    }
    if (isBot) {
      request.uri = '/resume-fallback/index.html';
      return request;
    }
  }

  // 6. /admin/* gate. Closed by default; opens only when ADMIN_AUTH was
  //    populated at deploy time and the request carries a matching header.
  if (uri === '/admin' || uri.indexOf('/admin/') === 0) {
    if (ADMIN_AUTH === '__ADMIN_AUTH__' || ADMIN_AUTH === '') {
      return {
        statusCode: 503,
        statusDescription: 'Service Unavailable',
        headers: {
          'content-type': { value: 'text/plain; charset=utf-8' },
          'cache-control': { value: 'no-store' }
        },
        body: 'admin endpoint not configured at deploy time'
      };
    }
    var auth = request.headers.authorization;
    if (!auth || !auth.value || auth.value !== ADMIN_AUTH) {
      return {
        statusCode: 401,
        statusDescription: 'Unauthorized',
        headers: {
          'www-authenticate': { value: 'Basic realm="piercemoore admin"' },
          'cache-control': { value: 'no-store' }
        }
      };
    }
    // Authorized - fall through to the URL rewrite below so /admin/stats
    // resolves to /admin/stats/index.html the same way / resolves to
    // /index.html.
  }

  // 7. Clean-URL rewrite.
  //    Astro builds paths like /cv -> dist/cv/index.html. CloudFront/S3
  //    won't auto-resolve a directory listing, so we map:
  //       /            -> /index.html         (defaultRootObject handles this)
  //       /cv          -> /cv/index.html
  //       /cv/         -> /cv/index.html
  //       /humans.txt  -> /humans.txt         (has dot, pass through)
  if (uri.length > 0 && uri[uri.length - 1] === '/') {
    request.uri = uri + 'index.html';
  } else if (uri.indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }

  return request;
}
