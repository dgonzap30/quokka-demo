// ============================================
// Thread Summary Generation API Route
// ============================================
//
// Generates AI-powered summaries of thread key takeaways using Vercel AI SDK.
// Focuses on actionable insights and learning outcomes rather than question recap.

import { generateText } from 'ai';
import { getAISDKModel, getAISDKConfig } from '@/lib/llm/ai-sdk-providers';
import { rateLimit } from '@/lib/utils/rate-limit';
import { commonErrors } from '@/lib/api/errors';
import type { GenerateSummaryInput, GenerateSummaryResult } from '@/lib/models/types';

// Allow up to 10 seconds for summary generation
export const maxDuration = 10;

// Rate limiter: 5 summary requests per minute per thread
const limiter = rateLimit({ requests: 5, window: '1m' });

/**
 * System prompt for summary generation
 *
 * Instructs the LLM to extract key takeaways as bullet points.
 * Emphasizes actionable insights over question recap.
 */
const SUMMARY_SYSTEM_PROMPT = `You are a teaching assistant analyzing academic Q&A threads.
Extract the KEY TAKEAWAYS from this thread - the actionable insights
or learning outcomes a student should remember.

Requirements:
- 2-4 bullet points maximum
- Each point should be a complete, actionable insight
- Focus on "what did we learn" not "what was asked"
- Academic tone, clear and concise
- 150-200 words total
- Use markdown bullet points (•)

Example Output:
• Binary search achieves O(log n) time complexity by halving the search space with each iteration, making it ideal for sorted datasets
• The algorithm requires a sorted array as input - sorting overhead must be considered when choosing this approach
• Common pitfall: Off-by-one errors in boundary conditions can be avoided by using the formula mid = low + (high - low) / 2

IMPORTANT: Return ONLY the bullet points. No introduction, no conclusion, no commentary.`;

/**
 * Build user prompt from thread content
 *
 * Combines title, content, and optional AI answer into context for LLM.
 */
function buildUserPrompt(input: GenerateSummaryInput): string {
  let prompt = `Thread Title: ${input.threadTitle}\n\n`;
  prompt += `Thread Content:\n${input.threadContent}\n\n`;

  if (input.aiAnswerContent) {
    prompt += `AI Answer:\n${input.aiAnswerContent}\n\n`;
  }

  if (input.conversationMessages && input.conversationMessages.length > 0) {
    prompt += `Conversation Messages:\n`;
    input.conversationMessages.forEach((msg, idx) => {
      const role = msg.role === 'user' ? 'Student' : 'AI Assistant';
      prompt += `${idx + 1}. ${role}: ${msg.content}\n\n`;
    });
  }

  prompt += `Extract the key takeaways from this thread as 2-4 bullet points.`;

  return prompt;
}

/**
 * POST /api/threads/generate-summary
 *
 * Generates an AI summary of thread key takeaways.
 * Uses generateText (non-streaming) for complete summary in single response.
 *
 * Request body:
 * - threadId: string (for rate limiting)
 * - threadTitle: string
 * - threadContent: string
 * - aiAnswerContent?: string (optional)
 * - conversationMessages?: AIMessage[] (optional)
 *
 * Returns: GenerateSummaryResult
 * - summary: string (2-4 bullet points)
 * - confidenceScore: number (0-100)
 * - modelUsed: string
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json() as GenerateSummaryInput;
    const { threadId, threadTitle, threadContent, aiAnswerContent, conversationMessages } = body;

    // Validation
    if (!threadId || !threadTitle || !threadContent) {
      return commonErrors.validationError('threadId, threadTitle, and threadContent are required');
    }

    // Check rate limit (per thread to prevent abuse)
    const rateCheck = await limiter.check(threadId);
    if (!rateCheck.allowed) {
      console.warn(`[Summary] Thread ${threadId} exceeded rate limit: ${rateCheck.count}/${rateCheck.limit} requests`);
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
    const systemPrompt = SUMMARY_SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt({ threadId, threadTitle, threadContent, aiAnswerContent, conversationMessages });

    // Get AI SDK configuration
    const config = getAISDKConfig();

    // Generate summary (non-streaming)
    const startTime = Date.now();
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Lower temperature for more consistent summaries
      maxTokens: 300, // ~200 words
      topP: config.topP,
    });

    const generationTime = Date.now() - startTime;
    console.log(`[Summary] Generated for thread ${threadId} in ${generationTime}ms`);

    // Extract model name from result
    const modelUsed = result.model || 'unknown';

    // Calculate confidence score based on generation quality
    // Higher score if:
    // - Summary is within desired length (150-200 words)
    // - Contains bullet points
    // - No errors or warnings
    const wordCount = result.text.split(/\s+/).length;
    const hasBulletPoints = result.text.includes('•') || result.text.includes('-') || result.text.includes('*');
    const hasWarnings = result.warnings && result.warnings.length > 0;

    let confidenceScore = 70; // Base score

    if (wordCount >= 50 && wordCount <= 250) {
      confidenceScore += 15;
    }

    if (hasBulletPoints) {
      confidenceScore += 10;
    }

    if (!hasWarnings) {
      confidenceScore += 5;
    }

    // Cap at 100
    confidenceScore = Math.min(100, confidenceScore);

    // Return result
    const summaryResult: GenerateSummaryResult = {
      summary: result.text.trim(),
      confidenceScore,
      modelUsed,
    };

    return Response.json(summaryResult, { status: 200 });
  } catch (error) {
    console.error('[Summary] Error:', error);

    // Return structured error
    return commonErrors.internalError(error);
  }
}
