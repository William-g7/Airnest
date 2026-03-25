import { NextRequest, NextResponse } from 'next/server';
import {
  callWithTools,
  getLlmApiKey,
  type ToolCallResult,
} from '@/src/shared/ai/llm-client';
import type OpenAI from 'openai';

/**
 * AI 自然语言搜索解析
 *
 * 接收用户的自然语言描述，通过 LLM function calling 提取结构化搜索参数。
 * 失败时降级：将原始输入作为 location 关键词返回。
 */

export interface AISearchParams {
  location?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  min_price?: number;
  max_price?: number;
  category?: string;
  place_type?: string;
}

const SYSTEM_PROMPT = `You are a search assistant for a vacation rental platform (like Airbnb).
The user will describe what they are looking for in natural language (in any language).
Your task is to extract structured search parameters by calling the search_properties function.

Rules:
- Always try to extract at least one parameter. Even a single keyword should map to something.
- If the input matches or closely resembles a category name (apartment, beach house, castle, hotel, etc.), set the "category" field.
- If the input looks like a place/city/country name, set "location".
- If the input contains both location and property type info, set both fields.
- For location, extract the place name in English (e.g. "巴黎" → "Paris").
- For dates, use YYYY-MM-DD format. If relative (e.g. "next weekend"), calculate from today: ${new Date().toISOString().split('T')[0]}.
- For price, always convert to USD per night.
- For category, pick the closest match from: apartment, beach house, bed and breakfast, castle, farm house, ferry, hotel, house, treehouse.
- Only return an empty object if the input is completely irrelevant nonsense.

Examples:
- "apartment" → { "category": "apartment" }
- "Paris" → { "location": "Paris" }
- "beach house in Vancouver under 200" → { "category": "beach house", "location": "Vancouver", "max_price": 200 }
- "3 bedrooms Tokyo" → { "location": "Tokyo", "bedrooms": 3 }`;

const searchTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_properties',
    description: 'Search for rental properties based on structured criteria extracted from user input.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City, region, or area name (in English)',
        },
        check_in: {
          type: 'string',
          description: 'Check-in date in YYYY-MM-DD format',
        },
        check_out: {
          type: 'string',
          description: 'Check-out date in YYYY-MM-DD format',
        },
        guests: {
          type: 'number',
          description: 'Number of guests (minimum 1)',
        },
        bedrooms: {
          type: 'number',
          description: 'Minimum number of bedrooms',
        },
        bathrooms: {
          type: 'number',
          description: 'Minimum number of bathrooms',
        },
        min_price: {
          type: 'number',
          description: 'Minimum price per night in USD',
        },
        max_price: {
          type: 'number',
          description: 'Maximum price per night in USD',
        },
        category: {
          type: 'string',
          enum: [
            'apartment',
            'beach house',
            'bed and breakfast',
            'castle',
            'farm house',
            'ferry',
            'hotel',
            'house',
            'treehouse',
          ],
          description: 'Property category type',
        },
        place_type: {
          type: 'string',
          enum: ['entire_place', 'private_room', 'shared_room'],
          description: 'Type of place/accommodation',
        },
      },
      required: [],
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query?.trim();
    console.log('[AI Parse] Received query:', query);

    if (!query) {
      console.log('[AI Parse] Empty query, returning 400');
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const hasKey = !!getLlmApiKey();
    console.log('[AI Parse] LLM API key present:', hasKey);
    if (!hasKey) {
      console.log('[AI Parse] No API key, returning fallback');
      return NextResponse.json(buildFallback(query, 'AI service not configured'));
    }

    console.log('[AI Parse] Calling LLM with model:', process.env.AI_MODEL || 'google/gemini-2.0-flash-001');
    const result: ToolCallResult<AISearchParams> = await callWithTools<AISearchParams>({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query },
      ],
      tools: [searchTool],
      toolChoice: { type: 'function', function: { name: 'search_properties' } },
    });

    console.log('[AI Parse] LLM result:', JSON.stringify(result));

    if (!result.success || !result.data) {
      console.log('[AI Parse] LLM failed, returning fallback. Error:', result.error);
      return NextResponse.json(buildFallback(query, result.error));
    }

    const params = sanitize(result.data);
    console.log('[AI Parse] Sanitized params:', JSON.stringify(params));

    const response = {
      success: true,
      params,
      fallback: false,
      raw_query: query,
    };
    console.log('[AI Parse] Returning success response');
    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Parse] Uncaught error:', msg);

    const query = (await request.json().catch(() => ({}))).query || '';
    return NextResponse.json(buildFallback(query, msg));
  }
}

function buildFallback(query: string, reason?: string) {
  return {
    success: true,
    params: { location: query } as AISearchParams,
    fallback: true,
    fallback_reason: reason,
    raw_query: query,
  };
}

function sanitize(raw: AISearchParams): AISearchParams {
  const p: AISearchParams = {};

  if (raw.location && typeof raw.location === 'string') p.location = raw.location.trim();
  if (raw.check_in && /^\d{4}-\d{2}-\d{2}$/.test(raw.check_in)) p.check_in = raw.check_in;
  if (raw.check_out && /^\d{4}-\d{2}-\d{2}$/.test(raw.check_out)) p.check_out = raw.check_out;
  if (typeof raw.guests === 'number' && raw.guests >= 1) p.guests = Math.floor(raw.guests);
  if (typeof raw.bedrooms === 'number' && raw.bedrooms >= 1) p.bedrooms = Math.floor(raw.bedrooms);
  if (typeof raw.bathrooms === 'number' && raw.bathrooms >= 1) p.bathrooms = Math.floor(raw.bathrooms);
  if (typeof raw.min_price === 'number' && raw.min_price > 0) p.min_price = raw.min_price;
  if (typeof raw.max_price === 'number' && raw.max_price > 0) p.max_price = raw.max_price;
  if (raw.category) p.category = raw.category;
  if (raw.place_type) p.place_type = raw.place_type;

  return p;
}
