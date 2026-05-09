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
 *   4. /resume.pdf bot gate. Returns 403 to non-browser User-Agents so
 *      the analytics rollup counts only human downloads.
 *   5. /admin/* HTTP Basic Auth gate. The expected header value is
 *      injected at synth time from the PIERCEMOORE_ADMIN_AUTH env var
 *      (or computed from PIERCEMOORE_ADMIN_USER + PIERCEMOORE_ADMIN_PASS).
 *      If the env var is unset, the placeholder remains and the gate
 *      returns 503 for every /admin/* request - admin is locked by
 *      default, you have to opt in by setting the env var at deploy.
 *   6. Clean-URL rewriting so /cv -> /cv/index.html for the S3 origin.
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

  // 4. /resume.pdf bot gate. Goal: count only human downloads in the
  //    analytics rollup. Bots get 403; the 403 still lands in CloudFront
  //    access logs (with status 403), so the analytics workflow can count
  //    the blocks separately from the human-served 200/206s.
  //
  //    Heuristic: User-Agent string. Empty UA -> bot. Any string match
  //    against the pattern list -> bot. Sophisticated UA-spoofers will
  //    slip through; that's a known limitation of UA filtering. Adding
  //    WAF / Bot Control later upgrades this.
  //
  //    The 403 carries Cache-Control: no-store so a bot's denial is
  //    never served to a subsequent human request.
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
      return {
        statusCode: 403,
        statusDescription: 'Forbidden',
        headers: {
          'content-type': { value: 'text/plain; charset=utf-8' },
          'cache-control': { value: 'no-store' },
          'x-blocked-reason': { value: 'bot-or-non-browser-user-agent' }
        },
        body: 'hello bot. this file is for human review only.\n'
      };
    }
  }

  // 5. /admin/* gate. Closed by default; opens only when ADMIN_AUTH was
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

  // 6. Clean-URL rewrite.
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
