import { NextResponse } from 'next/server';
import { userStore } from '../../lib/userStore';

export async function GET() {
  const isOpen = userStore.getUserMap().size === 0;
  return NextResponse.json({ open: isOpen });
}
