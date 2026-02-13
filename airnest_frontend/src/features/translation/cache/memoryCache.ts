'use client';

interface CacheEntry {
  translation: string;
  timestamp: number;
}

/** 轻量内存缓存（默认 1000 项、30 分钟 TTL） */
export class MemoryTranslationCache {
  private cache = new Map<string, CacheEntry>();
  constructor(private maxSize = 1000, private ttlMinutes = 30) {}

  private key(text: string, locale: string) { return `${text}__${locale}`; }
  private ttlMs() { return this.ttlMinutes * 60 * 1000; }

  private isExpired(entry: CacheEntry) {
    return Date.now() - entry.timestamp > this.ttlMs();
  }
  private cleanup() {
    for (const [k, v] of this.cache){
      if (this.isExpired(v)) this.cache.delete(k);
    }
  }
  private enforceMax() {
    if (this.cache.size <= this.maxSize) return;
    const entries = [...this.cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < entries.length - this.maxSize; i++){
      this.cache.delete(entries[i][0]);
    }
  }

  get(text: string, locale: string): string | null {
    const e = this.cache.get(this.key(text, locale));
    if (!e || this.isExpired(e)) { 
      if (e) this.cache.delete(this.key(text, locale)); 
      return null;
    }
    return e.translation;
  }

  set(text: string, locale: string, translation: string) {
    this.cache.set(this.key(text, locale), { translation, timestamp: Date.now() });
    if (this.cache.size % 50 === 0) { 
      this.cleanup(); this.enforceMax(); 
    }
  }
  
  clear() { this.cache.clear(); }
}

declare global {
  // eslint-disable-next-line no-var
  var __memoryTransCache__: MemoryTranslationCache | undefined;
}

export const memoryTranslationCache =
  globalThis.__memoryTransCache__ ?? (globalThis.__memoryTransCache__ = new MemoryTranslationCache());

export type { CacheEntry };
