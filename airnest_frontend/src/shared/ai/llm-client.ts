import 'server-only';
import OpenAI from 'openai';

/**
 * Do not instantiate OpenAI at module load. During `next build` (e.g. Vercel),
 * OPENROUTER_API_KEY may be unset; the SDK throws if apiKey is missing.
 * Lazy-init only when a key exists so route modules can import this file safely.
 */
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: key,
    });
  }
  return openaiClient;
}

const DEFAULT_MODEL = process.env.AI_MODEL || 'google/gemini-2.0-flash-001';
const DEFAULT_TIMEOUT = Number(process.env.AI_TIMEOUT_MS) || 8000;

export interface ToolCallResult<T = unknown> {
  success: boolean;
  data: T | null;
  fallback: boolean;
  error?: string;
}

/**
 * Call LLM with function calling and return the parsed tool call result.
 * Handles timeout, parse errors, and API failures gracefully.
 */
export async function callWithTools<T>(options: {
  messages: OpenAI.ChatCompletionMessageParam[];
  tools: OpenAI.ChatCompletionTool[];
  toolChoice: OpenAI.ChatCompletionToolChoiceOption;
  model?: string;
  timeoutMs?: number;
}): Promise<ToolCallResult<T>> {
  const { messages, tools, toolChoice, model = DEFAULT_MODEL, timeoutMs = DEFAULT_TIMEOUT } = options;

  const openai = getOpenAI();
  if (!openai) {
    return {
      success: false,
      data: null,
      fallback: true,
      error: 'AI service not configured (OPENROUTER_API_KEY)',
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`[LLM] Calling OpenRouter model=${model}, timeout=${timeoutMs}ms`);
    const response = await openai.chat.completions.create(
      {
        model,
        messages,
        tools,
        tool_choice: toolChoice,
        temperature: 0,
      },
      { signal: controller.signal },
    );

    console.log('[LLM] Raw response choices:', JSON.stringify(response.choices?.[0]?.message));

    const toolCall = response.choices[0]?.message?.tool_calls?.[0] as
      | { type: 'function'; function: { name: string; arguments: string } }
      | undefined;
    if (!toolCall?.function?.arguments) {
      console.log('[LLM] No tool_calls in response, returning fallback');
      return { success: false, data: null, fallback: true, error: 'No tool call in response' };
    }

    console.log('[LLM] Tool call arguments:', toolCall.function.arguments);
    const parsed = JSON.parse(toolCall.function.arguments) as T;
    console.log('[LLM] Parsed result:', JSON.stringify(parsed));
    return { success: true, data: parsed, fallback: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown LLM error';
    const isTimeout = message.includes('aborted');
    console.error(`[LLM] ${isTimeout ? 'Timeout' : 'Error'}: ${message}`);
    if (err instanceof Error && err.stack) console.error('[LLM] Stack:', err.stack);
    return { success: false, data: null, fallback: true, error: message };
  } finally {
    clearTimeout(timer);
  }
}
