// ============================================
// Conversation Restructuring API Route
// ============================================
//
// Restructures AI conversations into clean, well-formatted threads using Vercel AI SDK.
// Extracts citations, generates tags, and improves answer quality.

import { generateObject } from 'ai';
import { z } from 'zod';
import { getAISDKModel, getAISDKConfig } from '@/lib/llm/ai-sdk-providers';
import { rateLimit } from '@/lib/utils/rate-limit';
import { commonErrors } from '@/lib/api/errors';
import type { RestructureConversationInput, RestructureConversationResult, AIMessage } from '@/lib/models/types';

// Allow up to 15 seconds for restructuring
export const maxDuration = 15;

// Rate limiter: 3 restructure requests per minute per user
const limiter = rateLimit({ requests: 3, window: '1m' });

/**
 * Zod schema for structured conversation restructuring output
 *
 * Defines the exact shape of the restructured conversation.
 * AI SDK will enforce this schema using function calling.
 */
const RestructureSchema = z.object({
  title: z.string().describe('Clear, concise thread title (max 100 characters)'),
  mainQuestion: z.string().describe('Reformulated primary question with context'),
  bestAnswer: z.string().describe('Best answer with improvements and clarity'),
  supportingContext: z.string().describe('Additional helpful context or background'),
  citations: z.array(
    z.object({
      id: z.string().describe('Unique citation ID'),
      sourceType: z.enum(['lecture', 'textbook', 'slides', 'lab', 'assignment', 'reading']).describe('Type of source material'),
      source: z.string().describe('Source name or title'),
      excerpt: z.string().describe('Relevant excerpt from the source'),
      relevance: z.number().min(0).max(100).describe('Relevance score 0-100'),
    })
  ).describe('Extracted citations from AI responses'),
  tags: z.array(z.string()).describe('Auto-generated relevant tags (3-5 tags)'),
});

/**
 * System prompt for conversation restructuring
 *
 * Instructs the LLM to intelligently restructure conversation into thread format.
 */
const RESTRUCTURE_SYSTEM_PROMPT = `You are a teaching assistant helping students convert private AI conversations into public Q&A threads.

Your task is to restructure the conversation into a clear, well-formatted thread that others can learn from.

Guidelines:
1. **Title**: Extract the main question as a clear, searchable title (max 100 characters)
2. **Main Question**: Reformulate the student's question with full context and clarity
3. **Best Answer**: Combine insights from the conversation into a comprehensive answer
4. **Supporting Context**: Include prerequisites, background, or additional helpful info
5. **Citations**: Extract any references to course materials mentioned in AI responses
   - Look for mentions like "as discussed in Lecture 5" or "see Chapter 3"
   - Only include citations that are explicitly mentioned, don't invent sources
6. **Tags**: Generate 3-5 relevant tags for categorization (e.g., algorithms, binary-search, recursion)

Quality Requirements:
- Use academic tone throughout
- Improve clarity and structure compared to original conversation
- Fix any typos or grammatical errors
- Ensure answer is self-contained (stands alone without conversation context)
- Citations must be real references from the conversation, not hallucinated

Return a structured object with all fields filled.`;

/**
 * Build user prompt from conversation messages
 */
function buildUserPrompt(messages: AIMessage[], courseCode: string): string {
  let prompt = `Course: ${courseCode}\n\n`;
  prompt += `Conversation Messages:\n\n`;

  messages.forEach((msg, idx) => {
    const role = msg.role === 'user' ? 'Student' : 'AI Assistant';
    prompt += `${idx + 1}. ${role}:\n${msg.content}\n\n`;
  });

  prompt += `\nRestructure this conversation into a clear thread format with citations and tags.`;

  return prompt;
}

/**
 * POST /api/conversations/restructure
 *
 * Restructures a conversation into thread format using structured output.
 * Uses generateObject to ensure consistent schema.
 *
 * Request body:
 * - messages: AIMessage[] (conversation to restructure)
 * - courseId: string (for context)
 * - courseCode: string (for context)
 * - userId: string (for rate limiting)
 *
 * Returns: RestructureConversationResult
 * - title, mainQuestion, bestAnswer, supportingContext, citations, tags
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { messages, courseId, courseCode, userId } = body as RestructureConversationInput & { userId: string };

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return commonErrors.validationError('messages array is required and must not be empty');
    }

    if (!courseId || !courseCode) {
      return commonErrors.validationError('courseId and courseCode are required');
    }

    if (!userId) {
      return commonErrors.validationError('userId is required for rate limiting');
    }

    // Check rate limit (per user to prevent abuse)
    const rateCheck = await limiter.check(userId);
    if (!rateCheck.allowed) {
      console.warn(`[Restructure] User ${userId} exceeded rate limit: ${rateCheck.count}/${rateCheck.limit} requests`);
      const response = commonErrors.rateLimitExceeded(rateCheck.retryAfter!);
      response.headers.set('Retry-After', rateCheck.retryAfter!.toString());
      response.headers.set('X-RateLimit-Limit', rateCheck.limit!.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', rateCheck.retryAfter!.toString());
      return response;
    }

    // Get AI SDK model
    const model = getAISDKModel();

    // If model is not available, return error
    if (!model) {
      return commonErrors.llmUnavailable();
    }

    // Build prompts
    const systemPrompt = RESTRUCTURE_SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(messages, courseCode);

    // Get AI SDK configuration
    const config = getAISDKConfig();

    // Generate structured output
    const startTime = Date.now();
    const result = await generateObject({
      model,
      schema: RestructureSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5, // Moderate temperature for balance between creativity and consistency
      maxTokens: 1500, // ~1000 words total
      topP: config.topP,
    });

    const generationTime = Date.now() - startTime;
    console.log(`[Restructure] Completed in ${generationTime}ms for user ${userId}`);

    // Extract and validate result
    const restructured = result.object;

    // Ensure citations have proper IDs
    const citationsWithIds = restructured.citations.map((citation, idx) => ({
      ...citation,
      id: citation.id || `cit-${Date.now()}-${idx}`,
    }));

    // Ensure tags are reasonable (3-5 tags)
    const limitedTags = restructured.tags.slice(0, 5);

    // Build final result
    const restructureResult: RestructureConversationResult = {
      title: restructured.title.substring(0, 100), // Enforce max length
      mainQuestion: restructured.mainQuestion,
      bestAnswer: restructured.bestAnswer,
      supportingContext: restructured.supportingContext,
      citations: citationsWithIds,
      tags: limitedTags,
    };

    return Response.json(restructureResult, { status: 200 });
  } catch (error) {
    console.error('[Restructure] Error:', error);

    // Return structured error
    return commonErrors.internalError(error);
  }
}
