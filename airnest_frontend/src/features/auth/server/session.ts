'use server';

import { cookies } from 'next/headers';
import { readSessionFromCookies } from '@/app/api/auth/session/session-core';

/** ---------- 基础读取：提供最小粒度的 Cookie 读取 ---------- */

export async function getBFFUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('bff_user_id')?.value;
    return userId || null;
  } catch (error) {
    console.error('Failed to get BFF user ID:', error);
    return null;
  }
}

export async function getBFFAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('bff_access_token')?.value;
    return accessToken || null;
  } catch (error) {
    console.error('Failed to get BFF access token:', error);
    return null;
  }
}

export async function getBFFRefreshToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('bff_refresh_token')?.value;
    return refreshToken || null;
  } catch (error) {
    console.error('Failed to get BFF refresh token:', error);
    return null;
  }
}

/** ---------- 会话判定：服务端组件统一入口 ---------- */

export async function checkBFFSession() {
  try {
    const store = await cookies();
    return readSessionFromCookies(store);
  } catch {
    return { valid: false, userId: null, reason: 'server_error' as const };
  }
}

export async function clearBFFCookies() {
  const store = await cookies();
  store.delete('bff_user_id');
  store.delete('bff_access_token');
  store.delete('bff_refresh_token');
}

/** ---------- 合并自 UserContext：RSC 可直接消费的上下文 ---------- */

export interface UserContextData {
  isAuthenticated: boolean;
  userId: string | null;
  sessionValid: boolean;
  needsRefresh: boolean;
  accessExp: number | null;
  refreshExp: number | null;
}

export async function getUserContext(): Promise<UserContextData> {
  try {
    const cookieStore = await cookies();
    const sessionData = await readSessionFromCookies(cookieStore);
    return {
      isAuthenticated: sessionData.valid,
      userId: sessionData.userId,
      sessionValid: sessionData.valid,
      needsRefresh: sessionData.needsRefresh || false,
      accessExp: sessionData.accessExp,
      refreshExp: sessionData.refreshExp,
    };
  } catch (error) {
    console.error('[UserContext] Failed to read session:', error);
    return {
      isAuthenticated: false,
      userId: null,
      sessionValid: false,
      needsRefresh: false,
      accessExp: null,
      refreshExp: null,
    };
  }
}

export async function isUserAuthenticated(): Promise<boolean> {
  const context = await getUserContext();
  return context.isAuthenticated;
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const context = await getUserContext();
  return context.userId;
}