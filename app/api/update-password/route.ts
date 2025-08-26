import { NextRequest, NextResponse } from 'next/server';
import { getUserStore } from '@/lib/userStoreSingleton';
import { getSessionUser } from '@/lib/sessionHelpers';

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session?.username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { oldPassword, newPassword } = await req.json() as { oldPassword: string; newPassword: string };
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const userStore = getUserStore();
  if (!userStore.authenticate(session.username, oldPassword)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }
  userStore.updatePassword(session.username, newPassword);
  return NextResponse.json({ ok: true });
}
