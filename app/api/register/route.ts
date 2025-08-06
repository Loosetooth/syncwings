import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../lib/sessionHelpers';
import { userStore } from '../../lib/userStore';

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  const isFirstUser = userStore.getUserMap().size === 0;
  if (!isFirstUser && (!sessionUser || !sessionUser.isAdmin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }
  try {
    userStore.addUser(username, password);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
