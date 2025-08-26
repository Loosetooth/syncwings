import { NextResponse } from 'next/server';
import { getUserStore } from '@/lib/userStoreSingleton';

export async function GET() {
  const isOpen = getUserStore().getUserMap().size === 0;
  return NextResponse.json({ open: isOpen });
}
