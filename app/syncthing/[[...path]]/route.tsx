import { NextRequest } from 'next/server';
import http from 'http';
import { userStore } from '../../lib/userStore';

// Helper: get the port for the current user
function getSyncthingPort(username: string): number | null {
  const user = userStore.getUserMap().get(username);
  if (!user) return null;
  return 8384 + user.index;
}

/**
 * Handles the proxying of Syncthing requests.
 * It retrieves the session user from the request, determines the Syncthing port,
 * and proxies the request to the appropriate Syncthing instance.
 * It supports GET, POST, PUT, PATCH, DELETE, OPTIONS, and HEAD methods.
 * It also handles the path parameters to allow for catch-all routing.
 * If the user is not authenticated, it redirects to the login page.
 * Trailing slashes are manually removed because Next.js only supports either always or never having them.
 */
async function handleProxy(req: NextRequest): Promise<Response> {
  // Get session cookie
  const cookie = req.headers.get('cookie');
  let username = '';
  if (cookie) {
    const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('session='));
    if (match) {
      username = decodeURIComponent(match.split('=')[1]);
    }
  }
  if (!username) {
    // Redirect to login if not logged in
    return new Response(null, {
      status: 302,
      headers: { Location: '/login' },
    });
  }
  const port = getSyncthingPort(username);
  if (!port) {
    return new Response('No Syncthing instance found', { status: 404 });
  }

  // Build the path from the catch-all param, and strip the /syncthing prefix (mimic nginx)
  const url = new URL(req.url);
  let subPath = url.pathname.replace(/^\/syncthing/, '') || '/';
  // Remove trailing slash from subPath, except for root
  if (subPath.length > 1 && subPath.endsWith('/')) {
    subPath = subPath.slice(0, -1);
  }
  const targetUrl = `http://127.0.0.1:${port}${subPath}${url.search}`;

  return new Promise<Response>((resolve) => {
    // Clone and add custom header
    const headers = Object.fromEntries(req.headers.entries());
    headers['host'] = req.headers.get('host') || '';
    headers['x-real-ip'] = req.headers.get('x-real-ip') || '';
    headers['x-forwarded-for'] = req.headers.get('x-forwarded-for') || '';
    headers['x-forwarded-proto'] = req.headers.get('x-forwarded-proto') || (url.protocol.replace(':', ''));
    headers['x-forwarded-by'] = 'nextjs-reverse-proxy';
    headers['x-forwarded-prefix'] = '/syncthing';
    const proxyReq = http.request(targetUrl, {
      method: req.method,
      headers,
    }, proxyRes => {
      let body: Buffer[] = [];
      proxyRes.on('data', chunk => body.push(chunk));
      proxyRes.on('end', () => {
        const status = proxyRes.statusCode || 200;
        const headers = proxyRes.headers as any;
        const responseBody = (status === 204 || status === 304) ? undefined : Buffer.concat(body);
        const res = new Response(responseBody, { status, headers });
        resolve(res);
      });
    });
    proxyReq.on('error', (err: Error) => {
      console.error('Proxy request error:', err);
      const errorMsg = encodeURIComponent(`Proxy Error.
        ${err.message}
        Is the syncthing instance started? Is there incorrect data saved in the session cookie?`);
      resolve(new Response(null, {
        status: 302,
        headers: { Location: `/error?msg=${errorMsg}` },
      }));
    });
    // For methods with a body, pipe the body to the proxy request
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      req.arrayBuffer().then(buf => {
        proxyReq.write(Buffer.from(buf));
        proxyReq.end();
      }).catch(() => proxyReq.end());
    } else {
      proxyReq.end();
    }
  });
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
export const HEAD = handleProxy;
