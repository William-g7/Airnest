import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cookieSecureFlag } from '@auth/utils/cookieSecurity';


// bff登录逻辑处理。转发登录请求，接受响应并且设置cookie
interface LoginRequest {
  email: string;
  password: string;
  turnstile_token?: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;
const cookieDomain = process.env.NODE_ENV === 'production' ? '.airnest.me' : undefined;

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    // 转发登录请求到Django后端
    const response = await fetch(`${BACKEND_API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data: LoginResponse = await response.json();
    const secure = cookieSecureFlag(request);

    // 设置httpOnly cookies在前端域名
    const cookieStore = await cookies();
    
    // 设置用户ID cookie
    cookieStore.set('bff_user_id', data.user.id, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
      domain: cookieDomain
    });

    // 设置access token cookie  
    cookieStore.set('bff_access_token', data.access, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1小时
      path: '/',
      domain: cookieDomain
    });

    // 设置refresh token cookie
    cookieStore.set('bff_refresh_token', data.refresh, {
      httpOnly: true,
      secure,
      sameSite: 'strict', 
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
      domain: cookieDomain
    });

    // 只返回必要的用户信息，不暴露token
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      }
    });

  } catch (error) {
    console.error('BFF login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}