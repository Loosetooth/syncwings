import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '../../../lib/sessionHelpers';
import { userStore } from '../../../lib/userStore';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !user.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const users = userStore.readUsers().map(u => ({ username: u.username, isAdmin: u.isAdmin }));
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !user.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { username, password, isAdmin } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  try {
    await userStore.addUser(username, password, !!isAdmin);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !user.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });
  if (username === user.username) return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
  try {
    // Remove user implementation
    userStore.removeUser(username);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
