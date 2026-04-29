/**
 * CloudFront viewer-request function for piercemoore.com.
 *
 * Runtime: cloudfront-js-2.0 (ECMAScript 5.1+ with select ES6/ES2020 features).
 * No async/await, no fetch, no external imports. 10KB code limit. ~1ms budget.
 *
 * Responsibilities, in order:
 *   1. Vanity-domain 301 redirects:
 *        piercemoore.cv  → piercemoore.com/cv
 *        piercemoore.dev → piercemoore.com/writing
 *   2. www → apex 301 redirect (canonical URL).
 *   3. POST /api/ask → 501 JSON; other methods → 405. The /api/ask path
 *      is reserved for v2 — this stub keeps the route claimed.
 *   4. Clean-URL rewriting so /cv → /cv/index.html for the S3 origin.
 */

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

  // 2. www.piercemoore.com → piercemoore.com (preserve path + query).
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

  // 3. /api/ask — reserved for v2. Returns 501 on POST, 405 otherwise.
  if (uri === '/api/ask') {
    if (request.method === 'POST') {
      return {
        statusCode: 501,
        statusDescription: 'Not Implemented',
        headers: {
          'content-type': { value: 'application/json; charset=utf-8' },
          'cache-control': { value: 'no-store' }
        },
        body: '{"status":"not_implemented","note":"v2 — query interface"}'
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

  // 4. Clean-URL rewrite.
  //    Astro builds paths like /cv → dist/cv/index.html. CloudFront/S3
  //    won't auto-resolve a directory listing, so we map:
  //       /            → /index.html         (defaultRootObject handles this)
  //       /cv          → /cv/index.html
  //       /cv/         → /cv/index.html
  //       /humans.txt  → /humans.txt         (has dot, pass through)
  if (uri.length > 0 && uri[uri.length - 1] === '/') {
    request.uri = uri + 'index.html';
  } else if (uri.indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }

  return request;
}
