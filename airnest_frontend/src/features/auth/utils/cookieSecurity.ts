import { NextRequest } from 'next/server';

export function cookieSecureFlag(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  return proto === 'https';
}