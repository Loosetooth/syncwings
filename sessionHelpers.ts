import { NextRequest } from 'next/server';
import { userStore } from './userStore';

export async function getSessionUser(req: NextRequest) {
  const cookie = req.headers.get('cookie');
  let username = '';
  if (cookie) {
    const match = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('session='));
    if (match) {
      username = decodeURIComponent(match.split('=')[1]);
    }
  }
  if (!username) return null;
  const user = userStore.getUserMap().get(username);
  if (!user) return null;
  return user;
}
