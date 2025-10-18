// ============================================
// AI Chat API Route Handler (Phase 2: RAG Tools)
// ============================================
//
// Handles streaming AI conversations using Vercel AI SDK with tool calling.
// Supports dynamic course material retrieval via kb.search and kb.fetch tools.

import { streamText, convertToCoreMessages } from 'ai';
import { getAISDKModel, getAISDKConfig } from '@/lib/llm/ai-sdk-providers';
import { buildSystemPrompt } from '@/lib/llm/utils';
import { api } from '@/lib/api/client';
import { ragTools } from '@/lib/llm/tools';
import { rateLimit } from '@/lib/utils/rate-limit';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Rate limiter: 10 requests per minute per user
const limiter = rateLimit({ requests: 10, window: '1m' });

/**
 * POST /api/chat (Phase 2: RAG Tools Enabled)
 *
 * Handles streaming AI chat responses with dynamic course material retrieval.
 * Uses kb.search and kb.fetch tools for on-demand material access.
 *
 * Request body:
 * - messages: Array of chat messages (UI format)
 * - conversationId: ID of the conversation
 * - userId: ID of the current user
 * - courseId: Optional course ID for course-specific searches
 *
 * Tool Calling:
 * - kb.search: Search course materials by query (max 1 per turn)
 * - kb.fetch: Fetch specific material by ID (max 1 per turn)
 *
 * Returns: Streaming text response with tool execution results
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const {
      messages,
      userId,
      courseId,
    } = body;

    // Validation
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateCheck = await limiter.check(userId);
    if (!rateCheck.allowed) {
      console.warn(`[Rate Limit] User ${userId} exceeded limit: ${rateCheck.count}/${rateCheck.limit} requests`);
      return Response.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please wait before trying again.',
          retryAfter: rateCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateCheck.retryAfter!.toString(),
            'X-RateLimit-Limit': rateCheck.limit!.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateCheck.retryAfter!.toString(),
          },
        }
      );
    }

    // Get AI SDK model
    const model = getAISDKModel();

    // If model is not available, return error (frontend will fall back to template)
    if (!model) {
      return Response.json(
        {
          error: 'LLM provider not available',
          code: 'LLM_UNAVAILABLE',
          message: 'AI service is not configured. Please set up API keys in .env.local',
        },
        { status: 503 }
      );
    }

    // Build system prompt with tool instructions
    const systemPrompt = buildSystemPrompt();

    // Add course context info (basic info, not full materials - tools will retrieve those)
    let courseContextInfo = '';
    if (courseId) {
      try {
        const course = await api.getCourse(courseId);
        if (course) {
          courseContextInfo = `\n\nCurrent Course Context: ${course.code} - ${course.name}\nWhen searching for materials, use courseId: "${courseId}"`;
        }
      } catch (error) {
        console.error('[AI Chat] Failed to load course info:', error);
      }
    }

    // Convert UI messages to AI SDK format
    const coreMessages = convertToCoreMessages(messages);

    // Get AI SDK configuration
    const config = getAISDKConfig();

    // Stream response with RAG tools enabled
    const result = streamText({
      model,
      system: systemPrompt + courseContextInfo,
      messages: coreMessages,
      tools: ragTools,
      temperature: config.temperature,
      topP: config.topP,
    });

    // Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[AI Chat] Error:', error);

    // Return structured error
    return Response.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
