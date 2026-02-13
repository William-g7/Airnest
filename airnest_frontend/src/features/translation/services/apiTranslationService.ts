// 短文本（title/city/country）→ GET /backend/translate
//长文本（如详情页 description）→ POST /backend/translate/batch/

const URL_BUDGET = 1900; // 预留一点安全空间，避免 URL 过长

/** 单条短文本：GET 可公共缓存（CDN），无需 Authorization */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text?.trim()) return '';

  const qs = new URLSearchParams();
  qs.set('l', targetLanguage);
  qs.append('q', text);

  try {
    const res = await fetch(`/api/backend/translate?${qs.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout?.(30000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.translations?.[text] ?? text;
  } catch (e) {
    console.error('Translation GET request failed:', e);
    return text;
  }
}

/** 批量短文本：GET 分片 + 稳定排序，提升 CDN 命中率；仅用于短文本 */
export async function translateBatch(texts: string[], targetLanguage: string): Promise<Record<string,string>> {
  if (!texts?.length) return {};

  const uniq = Array.from(new Set(texts.filter(Boolean)));
  // 稳定排序：同一集合 → 相同 URL → CDN 命中更高
  uniq.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const results: Record<string,string> = {};
  let chunk: string[] = [];

  const base = `/api/backend/translate?l=${encodeURIComponent(targetLanguage)}`;
  let currentLen = base.length;

  const flush = async () => {
    if (chunk.length === 0) return;
    const qs = new URLSearchParams();
    qs.set('l', targetLanguage);
    for (const q of chunk) qs.append('q', q);

    try {
      const res = await fetch(`/api/backend/translate?${qs.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout?.(60000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const map = data?.translations ?? {};
      for (const t of chunk) results[t] = map[t] ?? t;
    } catch (e) {
      console.error('Batch GET chunk failed:', e);
      for (const t of chunk) results[t] = t; // 兜底原文
    } finally {
      chunk = [];
      currentLen = base.length;
    }
  };

  for (const t of uniq) {
    const inc = `&q=${encodeURIComponent(t)}`.length;
    if (currentLen + inc > URL_BUDGET) await flush();
    chunk.push(t);
    currentLen += inc;
  }
  await flush();
  return results;
}

/** 长文本（如详情页 description）：POST，避免 URL 过长；仍走 BFF */
export async function translateLongText(text: string, targetLanguage: string): Promise<string> {
  if (!text || text.trim() === '') return '';
  try {
    const res = await fetch('/api/backend/translate/batch/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ texts: [text], target_language: targetLanguage }),
      signal: AbortSignal.timeout?.(60000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const map = data?.translations ?? {};
    return map[text] ?? text; // 兜底原文
  } catch (error) {
    console.error('Long text POST translate failed:', error);
    return text;
  }
}
