import { cookies } from 'next/headers';
import { parseJwt } from '@auth/utils/jwt';

export type SessionPayload = {
  valid: boolean;
  userId: string | null;
  accessExp: number | null;
  refreshExp: number | null;
  needsRefresh?: boolean;
  reason:
    | 'valid'
    | 'no_access_token'
    | 'access_token_expired'
    | 'invalid_token_format';
};

export async function readSessionFromCookies(
  store?: Awaited<ReturnType<typeof cookies>>
): Promise<SessionPayload> {
  const jar = store ?? (await cookies());

  const userId   = jar.get('bff_user_id')?.value ?? null;
  const access   = jar.get('bff_access_token')?.value ?? null;
  const refresh  = jar.get('bff_refresh_token')?.value ?? null;

  if (!userId || !access) {
    return { valid: false, userId: null, accessExp: null, refreshExp: null, reason: 'no_access_token' };
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const ap  = parseJwt<{ exp?: number }>(access);
    const accessExp  = ap?.exp ?? null;

    let refreshExp: number | null = null;
    if (refresh) {
      try {
        refreshExp = parseJwt<{ exp?: number }>(refresh)?.exp ?? null;
      } catch { /* ignore */ }
    }

    if (accessExp !== null && accessExp <= now) {
      return { valid: false, userId: null, accessExp, refreshExp, reason: 'access_token_expired' };
    }

    return {
      valid: true,
      userId,
      accessExp,
      refreshExp,
      needsRefresh: accessExp ? accessExp - now < 600 : false,
      reason: 'valid',
    };
  } catch {
    return { valid: false, userId: null, accessExp: null, refreshExp: null, reason: 'invalid_token_format' };
  }
}
