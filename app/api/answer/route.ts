// ============================================
// AI Answer API Route Handler
// ============================================
//
// Generates structured AI answers with citations using AI SDK's generateObject.
// Returns type-safe JSON with guaranteed schema compliance.

import { generateObject } from 'ai';
import { getAISDKModel, getAISDKConfig } from '@/lib/llm/ai-sdk-providers';
import { AIAnswerSchema } from '@/lib/llm/schemas/citation';
import { buildSystemPrompt } from '@/lib/llm/utils';
import { api } from '@/lib/api/client';
import { createHybridRetriever } from '@/lib/retrieval';
import { commonErrors } from '@/lib/api/errors';
import type { AIAnswer, CourseMaterial } from '@/lib/models/types';

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
      return commonErrors.validationError('Question');
    }

    if (!courseId) {
      return commonErrors.validationError('Course ID');
    }

    if (!userId) {
      return commonErrors.validationError('User ID');
    }

    // Get AI SDK model
    const model = getAISDKModel();

    // If model is not available, return error (frontend will fall back to template)
    if (!model) {
      return commonErrors.llmUnavailable();
    }

    // Load course and materials
    const course = await api.getCourse(courseId);
    const materials = await api.getCourseMaterials(courseId);

    if (!course) {
      return commonErrors.notFound('Course');
    }

    if (!materials || materials.length === 0) {
      return commonErrors.notFound('Course materials');
    }

    console.log(`[AI Answer] Generating answer for course ${course.code}, ${materials.length} materials available`);

    // Use hybrid retrieval system (same as kb_search tool)
    const { retriever } = await createHybridRetriever(materials as CourseMaterial[], {
      useRRF: true,
      rrfK: 60,
      useMMR: true,
      mmrLambda: 0.7,
    });

    // Retrieve top 5 relevant materials
    const results = await retriever.retrieve(question, 5);

    console.log(`[AI Answer] Found ${results.length} relevant materials`);

    // Format materials for LLM context
    let contextText = '';
    if (results.length > 0) {
      contextText = '**Relevant Course Materials:**\n\n';
      results.forEach((result, index) => {
        const material = result.material;
        contextText += `${index + 1}. **${material.title}** (${material.type})\n`;
        // Include excerpt or full content if short
        const excerpt = material.content.length > 300
          ? material.content.substring(0, 300) + '...'
          : material.content;
        contextText += `   ${excerpt}\n`;
        contextText += `   *Relevance: ${Math.round(result.score * 100)}%*\n\n`;
      });
      contextText += '---\n\n';
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt();

    // Build detailed prompt for answer generation
    const answerPrompt = `
[Course Context: ${course.code} - ${course.name}]

${contextText}

**Student Question:**
${question}

**Instructions:**
- Provide a clear, comprehensive answer to the student's question
- Use the provided course materials to support your answer
- Include citations to specific course materials you reference (use [1], [2], etc.)
- Assess your confidence in the answer accuracy
- Format your answer in markdown for readability
- Suggest 2-3 follow-up questions the student might find helpful
- Keep the answer between 200-500 words unless the question requires more depth
`.trim();

    // Get AI SDK configuration
    const config = getAISDKConfig();

    console.log('[AI Answer] Generating structured answer with AI SDK...');

    // Generate structured answer using generateObject
    const result = await generateObject({
      model,
      schema: AIAnswerSchema,
      system: systemPrompt,
      prompt: answerPrompt,
      temperature: config.temperature,
    });

    console.log(`[AI Answer] Generated answer with ${result.object.citations.length} citations`);

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
        materialsUsed: results.length,
        courseId: course.id,
        courseCode: course.code,
      },
    });
  } catch (error) {
    console.error('[AI Answer] Error:', error);

    // Return structured error
    return commonErrors.internalError(error);
  }
}
