import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readSessionFromCookies } from './session-core';

export async function GET(_req: NextRequest) {
  try {
    const store = await cookies();
    const payload = await readSessionFromCookies(store);
    return NextResponse.json(payload, { headers: { 'cache-control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ valid: false, userId: null, accessExp: null, refreshExp: null, reason: 'server_error' }, { status: 500 });
  }
}
