import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseJwt } from '@auth/utils/jwt';

// 前端触发refresh token, 带当前toekn去后端换新并设置新的cookie
interface RefreshResponse {
  access: string;
  refresh?: string;
}

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('bff_refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_API_URL}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      cookieStore.delete('bff_user_id');
      cookieStore.delete('bff_access_token');
      cookieStore.delete('bff_refresh_token');
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    }

    const data: RefreshResponse = await response.json();

    const res = NextResponse.json({ success: true });

    res.cookies.set('bff_access_token', data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/',
    });

    if (data.refresh) {
      res.cookies.set('bff_refresh_token', data.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', 
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    // 返回辅助信息（可选）
    try {
      const p = parseJwt<{ user_id?: string; sub?: string; exp: number }>(data.access);
      (res as any)._body = JSON.stringify({ success: true, userId: p.user_id || p.sub, accessExp: p.exp });
    } catch {}

    return res;
  } catch (e) {
    console.error('BFF refresh error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}