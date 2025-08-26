import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/sessionHelpers';
import { getUserStore } from '@/lib/userStoreSingleton';

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !user.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  try {
    const userStore = getUserStore();
    userStore.promoteToAdmin(username);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
