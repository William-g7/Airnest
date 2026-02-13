export type SearchState = {
  location: string;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  category: string;
};

// 最小化依赖：任何有 get(name) => string|null 的对象都可
type SearchParamsLike = { get(name: string): string | null };

export function parseQuery(sp: SearchParamsLike): SearchState {
  const get = (k: string) => sp.get(k);
  return {
    location: get('location') ?? '',
    check_in: get('check_in'),
    check_out: get('check_out'),
    guests: Math.max(1, parseInt(get('guests') || '1', 10)),
    category: get('category') ?? '',
  };
}

export function buildQuery(s: SearchState): URLSearchParams {
  const q = new URLSearchParams();
  if (s.location) q.set('location', s.location);
  if (s.check_in) q.set('check_in', s.check_in);
  if (s.check_out) q.set('check_out', s.check_out);
  if (s.guests > 1) q.set('guests', String(s.guests));
  if (s.category) q.set('category', s.category);
  return q;
}
