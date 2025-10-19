// ============================================
// AI Answer API Route Handler
// ============================================
//
// Generates structured AI answers with citations using AI SDK's generateObject.
// Returns type-safe JSON with guaranteed schema compliance.

import { generateObject } from 'ai';
import { getAISDKModel, getAISDKConfig } from '@/lib/llm/ai-sdk-providers';
import { AIAnswerSchema } from '@/lib/llm/schemas/citation';
// Note: buildCourseContext removed in Phase 3 cleanup
// This route needs refactoring to use createHybridRetriever or kb_search tool
import { buildSystemPrompt } from '@/lib/llm/utils';
import { api } from '@/lib/api/client';
import type { AIAnswer } from '@/lib/models/types';

// Allow up to 30 seconds for answer generation
export const maxDuration = 30;

/**
 * POST /api/answer
 *
 * Generates a structured AI answer with citations for a question.
 *
 * Request body:
 * - question: The question text
 * - courseId: ID of the course
 * - userId: ID of the user asking
 *
 * Returns: Structured AI answer with citations (JSON)
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    const { question, courseId, userId } = body;

    // Validation
    if (!question || typeof question !== 'string') {
      return Response.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!courseId) {
      return Response.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return Response.json(
        { error: 'User ID is required' },
        { status: 400 }
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

    // Load course and materials
    const course = await api.getCourse(courseId);
    const materials = await api.getCourseMaterials(courseId);

    if (!course) {
      return Response.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // TODO: This route needs refactoring after Phase 3 cleanup
    // buildCourseContext was removed. Options:
    // 1. Use createHybridRetriever directly (like kb_search tool does)
    // 2. Deprecate this route and use /api/chat with kb_search tool instead
    //
    // For now, return a placeholder error to avoid breaking the build
    return Response.json(
      {
        error: 'This endpoint is temporarily unavailable',
        code: 'ENDPOINT_DEPRECATED',
        message: 'Please use /api/chat with conversation-based Q&A instead',
      },
      { status: 501 } // Not Implemented
    );

    /* COMMENTED OUT - needs refactoring
    // Build course context
    const context = await buildCourseContext(
      course,
      materials || [],
      question,
      {
        maxMaterials: 5,
        minRelevance: 30,
        maxTokens: 2000,
      }
    );

    // Build system prompt
    const systemPrompt = buildSystemPrompt();

    // Build detailed prompt for answer generation
    const answerPrompt = `
[Course Context: ${course.code} - ${course.name}]

${context.contextText}

---

**Student Question:**
${question}

**Instructions:**
- Provide a clear, comprehensive answer to the student's question
- Use the provided course materials to support your answer
- Include citations to specific course materials you reference
- Assess your confidence in the answer accuracy
- Format your answer in markdown for readability
- Suggest 2-3 follow-up questions the student might find helpful
- Keep the answer between 200-500 words unless the question requires more depth
`.trim();

    // Get AI SDK configuration
    const config = getAISDKConfig();

    // Generate structured answer using generateObject
    const result = await generateObject({
      model,
      schema: AIAnswerSchema,
      system: systemPrompt,
      prompt: answerPrompt,
      temperature: config.temperature,
    });

    // Transform AI SDK output to our AIAnswer format
    const aiAnswer: AIAnswer = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Temporary ID
      threadId: '', // Will be set when thread is created
      courseId: courseId,
      content: result.object.content,
      confidenceLevel: result.object.confidence.level,
      confidenceScore: result.object.confidence.score,
      citations: result.object.citations.map(citation => ({
        id: `cite-${Math.random().toString(36).substring(7)}`,
        source: citation.source,
        sourceType: citation.sourceType,
        excerpt: citation.excerpt,
        relevance: citation.relevance,
      })),
      studentEndorsements: 0,
      instructorEndorsements: 0,
      totalEndorsements: 0,
      endorsedBy: [],
      instructorEndorsed: false,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Return structured answer
    return Response.json({
      success: true,
      answer: aiAnswer,
      metadata: {
        estimatedTokens: context.estimatedTokens,
        materialsUsed: context.materials.length,
        courseId: course.id,
        courseCode: course.code,
      },
    });
    */
  } catch (error) {
    console.error('[AI Answer] Error:', error);

    // Return structured error
    return Response.json(
      {
        success: false,
        error: 'Failed to generate AI answer',
        code: 'GENERATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
