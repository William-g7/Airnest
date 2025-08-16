// 轻量级内存缓存实现
// 用于英语用户或作为 IndexedDB 的降级方案

interface CacheEntry {
  translation: string;
  timestamp: number;
}

class MemoryTranslationCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttl: number; // 生存时间（毫秒）

  constructor(maxSize = 1000, ttlMinutes = 30) {
    this.maxSize = maxSize;
    this.ttl = ttlMinutes * 60 * 1000;
  }

  // 生成缓存键
  private getCacheKey(text: string, locale: string): string {
    return `${text}_${locale}`;
  }

  // 检查条目是否过期
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  // 清理过期条目
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  // 确保缓存大小不超过限制
  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxSize) return;

    // 删除最旧的条目
    const entries = Array.from(this.cache.entries());
    entries
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, this.cache.size - this.maxSize)
      .forEach(([key]) => this.cache.delete(key));
  }

  // 获取缓存的翻译
  get(text: string, locale: string): string | null {
    const key = this.getCacheKey(text, locale);
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    return entry.translation;
  }

  // 设置缓存
  set(text: string, locale: string, translation: string): void {
    const key = this.getCacheKey(text, locale);
    
    this.cache.set(key, {
      translation,
      timestamp: Date.now(),
    });

    // 定期清理和大小控制
    if (this.cache.size % 50 === 0) {
      this.cleanup();
      this.enforceMaxSize();
    }
  }

  // 清除所有缓存
  clear(): void {
    this.cache.clear();
  }

  // 获取缓存统计信息
  getStats() {
    this.cleanup();
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // 可以在后续版本中实现命中率统计
    };
  }
}

export default MemoryTranslationCache;