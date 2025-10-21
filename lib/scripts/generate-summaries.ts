// ============================================
// Batch Summary Generation Script
// ============================================
//
// Generates AI summaries for all threads that don't have one yet.
// Run this script to backfill summaries for existing threads.
//
// Usage:
// - In browser console: import('./lib/scripts/generate-summaries').then(m => m.generateAllSummaries())
// - Or trigger via admin API route: POST /api/admin/generate-summaries

import { getThreads, updateThread } from '@/lib/store/localStore';
import type { Thread, GenerateSummaryInput, GenerateSummaryResult } from '@/lib/models/types';

/**
 * Rate limiter for API calls
 * Ensures we don't overwhelm the LLM API
 */
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate summary for a single thread
 *
 * @param thread - Thread to generate summary for
 * @returns true if successful, false otherwise
 */
async function generateSummaryForThread(thread: Thread): Promise<boolean> {
  try {
    const input: GenerateSummaryInput = {
      threadId: thread.id,
      threadTitle: thread.title,
      threadContent: thread.content,
      aiAnswerContent: undefined, // Could fetch AI answer if needed
    };

    const response = await fetch('/api/threads/generate-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`[Batch] Failed to generate summary for thread ${thread.id}:`, error);
      return false;
    }

    const result: GenerateSummaryResult = await response.json();

    // Update thread in localStorage
    updateThread(thread.id, {
      aiSummary: {
        content: result.summary,
        generatedAt: new Date().toISOString(),
        confidenceScore: result.confidenceScore,
        modelUsed: result.modelUsed,
      },
    });

    console.log(`[Batch] ✓ Generated summary for thread ${thread.id}: "${thread.title.substring(0, 50)}..."`);
    return true;
  } catch (error) {
    console.error(`[Batch] Error generating summary for thread ${thread.id}:`, error);
    return false;
  }
}

/**
 * Generate summaries for all threads without one
 *
 * Processes threads sequentially with rate limiting to avoid API throttling.
 *
 * @param options - Configuration options
 * @returns Summary of operation results
 */
export async function generateAllSummaries(options: {
  /** Delay between requests in milliseconds (default: 2000 = 2 seconds) */
  delayMs?: number;
  /** Maximum number of threads to process (default: unlimited) */
  maxThreads?: number;
  /** Skip threads created before this date (ISO 8601 string) */
  createdAfter?: string;
} = {}): Promise<{
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}> {
  const { delayMs = 2000, maxThreads, createdAfter } = options;

  console.log('[Batch] Starting batch summary generation...');
  console.log(`[Batch] Rate limit: 1 request per ${delayMs}ms`);

  // Get all threads from localStorage
  const allThreads = getThreads();

  // Filter threads that need summaries
  let threadsToProcess = allThreads.filter(thread => {
    // Skip if already has summary
    if (thread.aiSummary) {
      return false;
    }

    // Skip if created before cutoff date
    if (createdAfter && new Date(thread.createdAt) < new Date(createdAfter)) {
      return false;
    }

    return true;
  });

  // Limit number of threads if specified
  if (maxThreads && threadsToProcess.length > maxThreads) {
    console.log(`[Batch] Limiting to ${maxThreads} threads (out of ${threadsToProcess.length} candidates)`);
    threadsToProcess = threadsToProcess.slice(0, maxThreads);
  }

  const total = allThreads.length;
  const toProcess = threadsToProcess.length;
  const skipped = total - toProcess;

  console.log(`[Batch] Found ${total} threads total`);
  console.log(`[Batch] ${toProcess} threads need summaries`);
  console.log(`[Batch] ${skipped} threads already have summaries or filtered out`);

  if (toProcess === 0) {
    console.log('[Batch] Nothing to do!');
    return { total, processed: 0, succeeded: 0, failed: 0, skipped };
  }

  // Process threads sequentially
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const thread of threadsToProcess) {
    console.log(`[Batch] Processing thread ${processed + 1}/${toProcess}...`);

    const success = await generateSummaryForThread(thread);

    processed++;
    if (success) {
      succeeded++;
    } else {
      failed++;
    }

    // Rate limit: wait before next request (except for last one)
    if (processed < toProcess) {
      console.log(`[Batch] Waiting ${delayMs}ms before next request...`);
      await delay(delayMs);
    }
  }

  // Summary
  console.log('\n[Batch] ====== Summary ======');
  console.log(`[Batch] Total threads: ${total}`);
  console.log(`[Batch] Processed: ${processed}`);
  console.log(`[Batch] Succeeded: ${succeeded} ✓`);
  console.log(`[Batch] Failed: ${failed} ✗`);
  console.log(`[Batch] Skipped: ${skipped}`);
  console.log(`[Batch] Success rate: ${((succeeded / processed) * 100).toFixed(1)}%`);

  return {
    total,
    processed,
    succeeded,
    failed,
    skipped,
  };
}

