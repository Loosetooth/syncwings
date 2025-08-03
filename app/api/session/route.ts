import { NextRequest, NextResponse } from 'next/server';
import { makeSessionCookie } from '../../../cookieHelpers';

export async function GET(req: NextRequest) {
  const cookie = req.headers.get('cookie');
  let username = '';
  if (cookie) {
    const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('session='));
    if (match) {
      username = decodeURIComponent(match.split('=')[1]);
    }
  }
  if (!username) {
    return NextResponse.json({ loggedIn: false });
  }
  // Refresh the session cookie expiry
  const newCookie = makeSessionCookie(username);
  const res = NextResponse.json({ loggedIn: true, username });
  res.headers.set('Set-Cookie', newCookie);
  return res;
}
