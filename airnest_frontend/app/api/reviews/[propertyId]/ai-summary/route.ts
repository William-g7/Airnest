import { NextRequest, NextResponse } from 'next/server';
import {
  callWithTools,
  getLlmApiKey,
  type ToolCallResult,
} from '@/src/shared/ai/llm-client';
import type OpenAI from 'openai';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;
const MIN_REVIEWS_FOR_SUMMARY = 3;

interface ReviewInsights {
  highlights: string[];
  concerns: string[];
  best_for: string[];
  summary_text: string;
}

interface BackendReview {
  id: string;
  rating: number;
  title?: string;
  content: string;
  user?: { name?: string };
  created_at?: string;
}

interface CachedSummary {
  highlights: string[];
  concerns: string[];
  best_for: string[];
  summary_text: string;
  reviews_count_at_generation: number;
  is_stale: boolean;
  generated_at: string;
  model_version: string;
}

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese (Simplified, 简体中文)',
  fr: 'French (Français)',
};

function buildSystemPrompt(locale: string) {
  const langName = LOCALE_NAMES[locale] || 'English';
  return `You are a review analyst for a vacation rental platform.
Analyze the provided guest reviews and extract structured insights.

CRITICAL: ALL output text MUST be written in ${langName}. Even if the reviews are in another language, you MUST translate and write every string value in ${langName}.
${locale === 'zh' ? 'You MUST write in 简体中文. Example: "位置绝佳", "房东热情好客", "适合情侣".' : ''}
${locale === 'fr' ? 'You MUST write in français. Example: "Emplacement idéal", "Hôte très accueillant".' : ''}

Rules:
- highlights: 3-5 most frequently praised aspects. Be specific and concise (under 15 words each). Written in ${langName}.
- concerns: 0-3 common complaints or things to be aware of. Only include if genuinely mentioned by multiple guests or particularly noteworthy. If reviews are overwhelmingly positive, return an empty array. Written in ${langName}.
- best_for: 2-4 traveler types this property suits. Written in ${langName}.
- summary_text: A single sentence (under 30 words) capturing the overall sentiment. Written in ${langName}.
- Base your analysis strictly on the reviews provided. Do not invent information.`;
}

const insightsTool: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'submit_review_insights',
    description: 'Submit structured insights extracted from guest reviews.',
    parameters: {
      type: 'object',
      properties: {
        highlights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top praised aspects (3-5 items)',
        },
        concerns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Common concerns or warnings (0-3 items)',
        },
        best_for: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ideal traveler types (2-4 items)',
        },
        summary_text: {
          type: 'string',
          description: 'One-sentence overall summary (under 30 words)',
        },
      },
      required: ['highlights', 'concerns', 'best_for', 'summary_text'],
    },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await params;
  const locale = request.nextUrl.searchParams.get('locale') || 'en';

  try {
    // 1. Check backend cache
    const cacheRes = await fetch(
      `${BACKEND_API_URL}/api/properties/${propertyId}/ai-review-summary/?locale=${locale}`,
    );

    if (cacheRes.ok) {
      const cached: CachedSummary = await cacheRes.json();
      if (!cached.is_stale) {
        return NextResponse.json({
          ...cached,
          source: 'cache',
        });
      }
      // stale — fall through to regenerate
    }

    // 2. Check if we have an API key
    if (!getLlmApiKey()) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 },
      );
    }

    // 3. Fetch reviews from backend
    const reviewsRes = await fetch(
      `${BACKEND_API_URL}/api/properties/${propertyId}/reviews/?page_size=50`,
    );
    if (!reviewsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 502 });
    }
    const reviewsData = await reviewsRes.json();
    const reviews: BackendReview[] = reviewsData.reviews || [];
    const totalCount: number = reviewsData.total_count || reviews.length;

    if (totalCount < MIN_REVIEWS_FOR_SUMMARY) {
      return NextResponse.json({
        error: 'not_enough_reviews',
        min_required: MIN_REVIEWS_FOR_SUMMARY,
        current_count: totalCount,
      }, { status: 404 });
    }

    // 4. Build prompt with review text
    const reviewTexts = reviews
      .map((r, i) => `Review ${i + 1} (${r.rating}/5): ${r.title ? r.title + ' — ' : ''}${r.content}`)
      .join('\n');

    const langName = LOCALE_NAMES[locale] || 'English';
    const userMessage = `Output language: ${langName}\nTotal reviews: ${totalCount}\n\n${reviewTexts}\n\nREMINDER: Write ALL output values in ${langName}. Do NOT use English unless the output language is English.`;

    // 5. Call LLM
    const model = process.env.AI_MODEL || 'google/gemini-2.0-flash-001';
    const result: ToolCallResult<ReviewInsights> = await callWithTools<ReviewInsights>({
      messages: [
        { role: 'system', content: buildSystemPrompt(locale) },
        { role: 'user', content: userMessage },
      ],
      tools: [insightsTool],
      toolChoice: { type: 'function', function: { name: 'submit_review_insights' } },
      timeoutMs: 12000,
    });

    if (!result.success || !result.data) {
      console.error('[AI Review Summary] LLM failed:', result.error);
      return NextResponse.json(
        { error: 'AI generation failed', detail: result.error },
        { status: 502 },
      );
    }

    const insights = result.data;

    // 6. Save to backend cache
    await fetch(
      `${BACKEND_API_URL}/api/properties/${propertyId}/ai-review-summary/?locale=${locale}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          highlights: insights.highlights || [],
          concerns: insights.concerns || [],
          best_for: insights.best_for || [],
          summary_text: insights.summary_text || '',
          reviews_count_at_generation: totalCount,
          model_version: model,
        }),
      },
    );

    // 7. Return to client
    return NextResponse.json({
      highlights: insights.highlights || [],
      concerns: insights.concerns || [],
      best_for: insights.best_for || [],
      summary_text: insights.summary_text || '',
      reviews_count_at_generation: totalCount,
      is_stale: false,
      generated_at: new Date().toISOString(),
      model_version: model,
      source: 'generated',
    });
  } catch (error) {
    console.error('[AI Review Summary] Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 },
    );
  }
}
