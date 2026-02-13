import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// bff登出处理。将refresh token发送给后端做会话处理，并且清理自己域下的所有cookies
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('bff_refresh_token')?.value;

    if (refreshToken) {
      try {
        await fetch(`${BACKEND_API_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }), 
        });
      } catch (err) {
        console.warn('Backend logout failed:', err);
      }
    }

    cookieStore.delete('bff_user_id');
    cookieStore.delete('bff_access_token');
    cookieStore.delete('bff_refresh_token');

    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (err) {
    const cookieStore = await cookies();
    cookieStore.delete('bff_user_id');
    cookieStore.delete('bff_access_token');
    cookieStore.delete('bff_refresh_token');
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
