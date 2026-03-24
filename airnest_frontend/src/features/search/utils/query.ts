export type SearchState = {
  location: string;
  check_in: string | null;
  check_out: string | null;
  guests: number;
  category: string;
  // AI 搜索扩展字段
  bedrooms?: number;
  bathrooms?: number;
  min_price?: number;
  max_price?: number;
  place_type?: string;
};

type SearchParamsLike = { get(name: string): string | null };

function optInt(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function optFloat(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function parseQuery(sp: SearchParamsLike): SearchState {
  const get = (k: string) => sp.get(k);
  return {
    location: get('location') ?? '',
    check_in: get('check_in'),
    check_out: get('check_out'),
    guests: Math.max(1, parseInt(get('guests') || '1', 10)),
    category: get('category') ?? '',
    bedrooms: optInt(get('bedrooms')),
    bathrooms: optInt(get('bathrooms')),
    min_price: optFloat(get('min_price')),
    max_price: optFloat(get('max_price')),
    place_type: get('place_type') || undefined,
  };
}

export function buildQuery(s: SearchState): URLSearchParams {
  const q = new URLSearchParams();
  if (s.location) q.set('location', s.location);
  if (s.check_in) q.set('check_in', s.check_in);
  if (s.check_out) q.set('check_out', s.check_out);
  if (s.guests > 1) q.set('guests', String(s.guests));
  if (s.category) q.set('category', s.category);
  if (s.bedrooms) q.set('bedrooms', String(s.bedrooms));
  if (s.bathrooms) q.set('bathrooms', String(s.bathrooms));
  if (s.min_price) q.set('min_price', String(s.min_price));
  if (s.max_price) q.set('max_price', String(s.max_price));
  if (s.place_type) q.set('place_type', s.place_type);
  return q;
}
