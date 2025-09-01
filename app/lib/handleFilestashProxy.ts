import { NextRequest } from 'next/server';
import http from 'http';
import { getSessionLight } from '@/lib/getSessionLight';

/**
 * Handles the proxying of Filestash requests.
 * It retrieves the session user from the request, determines the Filestash port,
 * and proxies the request to the appropriate Filestash instance.
 * It supports GET, POST, PUT, PATCH, DELETE, OPTIONS, and HEAD methods.
 * It also handles the path parameters to allow for catch-all routing.
 * If the user is not authenticated, it redirects to the login page.
 * Trailing slashes are manually removed because Next.js only supports either always or never having them.
 */
export async function handleFilestashProxy(req: NextRequest): Promise<Response> {
  // Get session from JWT
  const session = await getSessionLight(req);
  if (!session || !session.username || typeof session.index !== 'number') {
    // Redirect to login if not logged in
    return new Response(null, {
      status: 302,
      headers: { Location: '/login' },
    });
  }
  const port = 8334 + session.index;
  if (!port) {
    return new Response('No Filestash instance found', { status: 404 });
  }

  const url = new URL(req.url);
  if (url.pathname === '/filestash') {
    // Redirect to /filestash/ with original search/hash
    return new Response(null, {
      status: 308, // Permanent redirect (use 302 for temporary)
      headers: { Location: '/filestash/' + url.search + url.hash },
    });
  }

  // Build the path
  let subPath = url.pathname || '/';
  const targetUrl = `http://127.0.0.1:${port}${subPath}${url.search}`;

  return new Promise<Response>((resolve) => {
    const headers = Object.fromEntries(req.headers.entries());

    const proxyReq = http.request(targetUrl, {
      method: req.method,
      headers,
    }, proxyRes => {
      const status = proxyRes.statusCode || 200;
      // Clone headers so we can safely mutate
      const resHeaders = { ...proxyRes.headers } as any;
      // If 307 redirect, check Location header
      if (status == 307 && resHeaders.location) {
        try {
          const loc = resHeaders.location;
          if (typeof loc === 'string' && loc.startsWith('/') && !loc.startsWith('/filestash/')) {
            const urlObj = new URL(loc, 'http://dummy');
            urlObj.pathname = '/filestash/' + urlObj.pathname.replace(/^\//, '');
            resHeaders.location = urlObj.pathname + urlObj.search + urlObj.hash;
          }
        } catch (e) {
          // If Location is not a valid URL, skip modification
        }
      }

      // Stream the 'download' response using a ReadableStream
      const stream = new ReadableStream({
        start(controller) {
          proxyRes.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk)));
          proxyRes.on('end', () => controller.close());
          proxyRes.on('error', (err) => controller.error(err));
        }
      });
      // For 204/304, no body
      const responseBody = (status === 204 || status === 304) ? undefined : stream;
      const res = new Response(responseBody, { status, headers: resHeaders });
      resolve(res);
    });
    proxyReq.on('error', (err: Error) => {
      console.error('Proxy request error:', err);
      const errorMsg = encodeURIComponent(`Proxy Error.\n${err.message}\nIs the filestash instance started? Is there incorrect data saved in the session cookie?`);
      resolve(new Response(null, {
        status: 302,
        headers: { Location: `/error?msg=${errorMsg}` },
      }));
    });
    // For methods with a body, pipe the body to the proxy request
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body instanceof ReadableStream) {
      const reader = req.body.getReader();
      function pump() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            proxyReq.end();
            return;
          }
          proxyReq.write(Buffer.from(value));
          return pump();
        });
      }
      pump().catch(() => proxyReq.end());
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {
      req.arrayBuffer().then(buf => {
        proxyReq.write(Buffer.from(buf));
        proxyReq.end();
      }).catch(() => proxyReq.end());
    } else {
      proxyReq.end();
    }
  });
}