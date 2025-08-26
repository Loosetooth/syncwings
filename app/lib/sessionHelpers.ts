
import { NextRequest } from 'next/server';
import { getUserStore } from '@/lib/userStoreSingleton';
import { verifySessionJWT } from './jwtHelpers';

export async function getSessionUser(req: NextRequest) {
  const cookie = req.headers.get('cookie');
  let token = '';
  if (cookie) {
    const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('session='));
    if (match) {
      token = decodeURIComponent(match.split('=')[1]);
    }
  }
  if (!token) return null;
  const payload = await verifySessionJWT(token);
  if (!payload || !payload.username) return null;
  const user = getUserStore().getUserMap().get(payload.username);
  if (!user) return null;
  return user;
}
