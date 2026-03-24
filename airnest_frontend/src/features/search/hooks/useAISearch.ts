'use client';

import { useState, useCallback } from 'react';
import { useSearchQuery } from './useSearchQuery';
import type { SearchState } from '@search/utils/query';

interface AISearchResult {
  success: boolean;
  params: Record<string, unknown>;
  fallback: boolean;
  fallback_reason?: string;
  raw_query: string;
}

/**
 * Hook that sends a natural language query to the AI parse endpoint,
 * then maps the structured result into URL search params via replaceUrl().
 *
 * Falls back to a plain location search if AI fails or is unavailable.
 */
export function useAISearch() {
  const { replaceUrl } = useSearchQuery();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AISearchResult | null>(null);

  const search = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      console.log('[useAISearch] Starting search with query:', trimmed);
      setIsLoading(true);
      setLastResult(null);

      try {
        console.log('[useAISearch] Calling /api/search/ai-parse...');
        const res = await fetch('/api/search/ai-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
        });

        console.log('[useAISearch] Response status:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: AISearchResult = await res.json();
        console.log('[useAISearch] Parsed response:', JSON.stringify(data, null, 2));
        setLastResult(data);

        const p = data.params;
        const next: Partial<SearchState> = {};

        if (p.location && typeof p.location === 'string') next.location = p.location;
        if (p.check_in && typeof p.check_in === 'string') next.check_in = p.check_in;
        if (p.check_out && typeof p.check_out === 'string') next.check_out = p.check_out;
        if (typeof p.guests === 'number') next.guests = p.guests;
        if (typeof p.bedrooms === 'number') next.bedrooms = p.bedrooms;
        if (typeof p.bathrooms === 'number') next.bathrooms = p.bathrooms;
        if (typeof p.min_price === 'number') next.min_price = p.min_price;
        if (typeof p.max_price === 'number') next.max_price = p.max_price;
        if (p.category && typeof p.category === 'string') next.category = p.category;
        if (p.place_type && typeof p.place_type === 'string') next.place_type = p.place_type;

        // If AI returned empty params, fall back to raw query as location keyword
        if (Object.keys(next).length === 0) {
          console.log('[useAISearch] AI returned empty params, falling back to location keyword:', trimmed);
          next.location = trimmed;
        }

        console.log('[useAISearch] Mapped URL params:', JSON.stringify(next));
        console.log('[useAISearch] Calling replaceUrl...');
        replaceUrl(next);
        console.log('[useAISearch] replaceUrl called successfully');
      } catch (err) {
        console.error('[useAISearch] Error:', err);
        replaceUrl({ location: trimmed });
        setLastResult({
          success: true,
          params: { location: trimmed },
          fallback: true,
          fallback_reason: err instanceof Error ? err.message : 'Unknown error',
          raw_query: trimmed,
        });
      } finally {
        setIsLoading(false);
        console.log('[useAISearch] Done, isLoading set to false');
      }
    },
    [replaceUrl],
  );

  return {
    search,
    isLoading,
    isFallback: lastResult?.fallback ?? false,
    lastResult,
  };
}
