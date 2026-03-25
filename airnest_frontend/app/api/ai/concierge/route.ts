import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getLlmApiKey } from '@/src/shared/ai/llm-client';
import { buildContext } from '@/src/features/ai-concierge/utils/buildContext';
import { buildSystemPrompt } from '@/src/features/ai-concierge/utils/systemPrompt';
import type {
  ConciergeMessage,
  ConciergeRequest,
  PropertyContext,
  ReviewSummaryContext,
  RawReview,
} from '@/src/features/ai-concierge/types/types';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL;
const CONCIERGE_MODEL =
  process.env.AI_CONCIERGE_MODEL || 'openai/gpt-4o-mini';
const FIRST_TOKEN_TIMEOUT =
  Number(process.env.AI_CONCIERGE_TIMEOUT_MS) || 10_000;

const MAX_ROUNDS = 6;
const MAX_HISTORY_MESSAGES = MAX_ROUNDS * 2; // 6 user + 6 assistant
const MAX_QUESTION_LENGTH = 500;
const MAX_MESSAGE_CONTENT_LENGTH = 2000;

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per-instance; sufficient for dev/low-traffic)
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 10;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX_REQUESTS;
}

// Periodic cleanup to prevent memory leaks (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now >= bucket.resetAt) rateBuckets.delete(key);
  }
}, 5 * 60_000);

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------
function validateRequest(
  body: unknown,
): { ok: true; data: ConciergeRequest } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const { propertyId, question, conversationHistory, locale } =
    body as Record<string, unknown>;

  if (typeof propertyId !== 'string' || !propertyId.trim()) {
    return { ok: false, error: 'Missing propertyId' };
  }
  if (typeof question !== 'string' || !question.trim()) {
    return { ok: false, error: 'Missing question' };
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return {
      ok: false,
      error: `Question too long (max ${MAX_QUESTION_LENGTH} chars)`,
    };
  }

  // Validate conversationHistory
  if (!Array.isArray(conversationHistory)) {
    return { ok: false, error: 'conversationHistory must be an array' };
  }
  if (conversationHistory.length > MAX_HISTORY_MESSAGES) {
    return {
      ok: false,
      error: `Conversation limit reached (max ${MAX_ROUNDS} rounds)`,
    };
  }
  for (const msg of conversationHistory) {
    if (
      !msg ||
      typeof msg !== 'object' ||
      !['user', 'assistant'].includes(msg.role) ||
      typeof msg.content !== 'string' ||
      msg.content.length > MAX_MESSAGE_CONTENT_LENGTH
    ) {
      return { ok: false, error: 'Invalid message in conversationHistory' };
    }
  }

  const validLocale =
    typeof locale === 'string' && ['en', 'zh', 'fr'].includes(locale)
      ? locale
      : 'en';

  return {
    ok: true,
    data: {
      propertyId: propertyId.trim(),
      question: question.trim(),
      conversationHistory: conversationHistory as ConciergeMessage[],
      locale: validLocale,
    },
  };
}

// ---------------------------------------------------------------------------
// Data fetching helpers (direct to backend, same as other AI routes)
// ---------------------------------------------------------------------------
async function fetchPropertyDetail(
  propertyId: string,
): Promise<PropertyContext | null> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/api/properties/${propertyId}/with-reviews/`,
    );
    if (!res.ok) return null;
    return (await res.json()) as PropertyContext;
  } catch {
    return null;
  }
}

async function fetchAIReviewSummary(
  propertyId: string,
  locale: string,
): Promise<ReviewSummaryContext | null> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/api/properties/${propertyId}/ai-review-summary/?locale=${locale}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.is_stale) return null; // treat stale as unavailable
    return data as ReviewSummaryContext;
  } catch {
    return null;
  }
}

async function fetchRawReviews(
  propertyId: string,
): Promise<RawReview[] | null> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/api/properties/${propertyId}/reviews/?page_size=10`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.reviews || []) as RawReview[];
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    );
  }

  // Check API key
  if (!getLlmApiKey()) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 503 },
    );
  }

  // Parse & validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = validateRequest(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { propertyId, question, conversationHistory, locale } = validation.data;

  // Fetch property data + review context in parallel
  const [property, aiSummary] = await Promise.all([
    fetchPropertyDetail(propertyId),
    fetchAIReviewSummary(propertyId, locale),
  ]);

  if (!property) {
    return NextResponse.json(
      { error: 'Property not found' },
      { status: 404 },
    );
  }

  // If no AI summary available, fallback to raw reviews
  let rawReviews: RawReview[] | null = null;
  if (!aiSummary) {
    rawReviews = await fetchRawReviews(propertyId);
  }

  // Build context & system prompt
  const context = buildContext(property, aiSummary, rawReviews);
  const systemPrompt = buildSystemPrompt(context);

  // Assemble messages for LLM
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] =
    [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: question },
    ];

  // Stream from OpenRouter
  const openai = getOpenAIClient();
  if (!openai) {
    return NextResponse.json(
      { error: 'AI service not available' },
      { status: 503 },
    );
  }

  try {
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      FIRST_TOKEN_TIMEOUT,
    );

    const stream = await openai.chat.completions.create(
      {
        model: CONCIERGE_MODEL,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 500,
      },
      { signal: abortController.signal },
    );

    // Convert OpenAI stream → SSE ReadableStream
    const encoder = new TextEncoder();
    let firstTokenReceived = false;
    let doneSent = false;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              clearTimeout(timeout);
            }

            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
              );
            }

            // Check for finish (only send DONE once)
            if (chunk.choices[0]?.finish_reason && !doneSent) {
              doneSent = true;
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          console.error('[Concierge] Stream error:', msg);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: msg })}\n\n`,
            ),
          );
        } finally {
          controller.close();
        }
      },
      cancel() {
        // Client disconnected — abort the upstream LLM request
        abortController.abort();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const isTimeout = msg.includes('aborted');
    console.error(`[Concierge] ${isTimeout ? 'Timeout' : 'Error'}:`, msg);
    return NextResponse.json(
      { error: isTimeout ? 'Request timed out' : 'AI service error' },
      { status: isTimeout ? 504 : 502 },
    );
  }
}
