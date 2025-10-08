#!/usr/bin/env node

/**
 * Apply realistic engagement metrics to threads, posts, and AI answers
 * Based on formulas from engagement-patterns.md
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const mocksDir = join(__dirname, '..');

// Load data
const threads = JSON.parse(readFileSync(join(mocksDir, 'threads.json'), 'utf-8'));
const posts = JSON.parse(readFileSync(join(mocksDir, 'posts.json'), 'utf-8'));
const aiAnswers = JSON.parse(readFileSync(join(mocksDir, 'ai-answers.json'), 'utf-8'));
const courses = JSON.parse(readFileSync(join(mocksDir, 'courses.json'), 'utf-8'));

// Create course lookup
const courseLookup = {};
courses.forEach(c => {
  courseLookup[c.id] = c;
});

// Demo "now" for consistent calculations
const NOW = new Date('2025-10-07T12:00:00Z');

// Utility: random in range
function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

// Utility: random integer in range
function randomInt(min, max) {
  return Math.floor(randomInRange(min, max + 1));
}

// Course size factor
function getCourseSizeFactor(enrollmentCount) {
  if (enrollmentCount < 35) return 0.8;  // Small
  if (enrollmentCount > 50) return 1.3;  // Large
  return 1.0;  // Medium
}

// Calculate days since creation
function getDaysSince(dateStr) {
  const date = new Date(dateStr);
  const diff = NOW - date;
  return diff / (1000 * 60 * 60 * 24);
}

// Calculate quality factor for a thread
function calculateQualityFactor(thread, threadPosts, aiAnswer) {
  let score = 0;

  // Has AI answer with high confidence
  if (aiAnswer && aiAnswer.confidenceScore >= 85) {
    score += 0.4;
  } else if (aiAnswer) {
    score += 0.3;
  }

  // Has replies
  if (threadPosts.length > 0) {
    score += 0.2;
  }

  // Has endorsed posts
  const hasEndorsed = threadPosts.some(p => p.endorsed);
  if (hasEndorsed) {
    score += 0.3;
  }

  // Has instructor reply
  const instructorIds = ['user-instructor-1', 'user-instructor-2', 'user-instructor-3'];
  const hasInstructorReply = threadPosts.some(p => instructorIds.includes(p.authorId));
  if (hasInstructorReply) {
    score += 0.2;
  }

  // Thread is resolved
  if (thread.status === 'resolved') {
    score += 0.25;
  }

  return 1 + score;  // Range: 1.0 to 2.25
}

// Calculate thread views
function calculateThreadViews(thread, threadPosts, aiAnswer, course) {
  // Base views by status
  let baseViews;
  if (thread.status === 'resolved') {
    baseViews = randomInRange(20, 35);
  } else if (thread.status === 'answered') {
    baseViews = randomInRange(15, 25);
  } else {
    baseViews = randomInRange(8, 15);
  }

  // Age factor
  const days = getDaysSince(thread.createdAt);
  const ageFactor = Math.min(1 + (days / 7) * 0.5, 2.5);

  // Quality factor
  const qualityFactor = calculateQualityFactor(thread, threadPosts, aiAnswer);

  // Course size factor
  const courseSizeFactor = getCourseSizeFactor(course.enrollmentCount);

  // Calculate views
  const calculatedViews = Math.floor(baseViews * ageFactor * qualityFactor * courseSizeFactor);

  // Cap at 200
  return Math.min(calculatedViews, 200);
}

// Calculate post endorsement probability
function calculatePostEndorsementProbability(post, thread, author) {
  let probability = 0;

  // Role bonus
  if (author && author.role === 'instructor') {
    probability += 0.5;
  } else if (author && author.role === 'ta') {
    probability += 0.3;
  }

  // Content quality heuristics
  if (post.content.length > 200) {
    probability += 0.2;
  }

  if (post.content.includes('```')) {
    probability += 0.25;
  }

  if (/step \d/i.test(post.content)) {
    probability += 0.2;
  }

  // Thread quality correlation
  if (thread.status === 'resolved') {
    probability += 0.3;
  }

  // Cap at 0.95
  return Math.min(probability, 0.95);
}

// Calculate AI answer student endorsements
function calculateStudentEndorsements(aiAnswer, views) {
  const confidence = aiAnswer.confidenceScore;

  if (confidence >= 85) {
    // High confidence
    const base = Math.floor((confidence / 100) * (views / 10) * randomInRange(0.3, 0.6));
    return Math.max(0, base);
  } else if (confidence >= 60) {
    // Medium confidence
    const base = Math.floor((confidence / 100) * (views / 20) * randomInRange(0.2, 0.4));
    return Math.max(0, base);
  } else {
    // Low confidence
    return randomInt(0, 1);
  }
}

// Check if instructor should endorse AI answer
function shouldInstructorEndorse(aiAnswer, thread, views) {
  // Must be high confidence
  if (aiAnswer.confidenceScore < 80) return false;

  // Must have quality citations (2+ citations, relevance >= 85)
  const qualityCitations = aiAnswer.citations.filter(c => c.relevance >= 85);
  if (qualityCitations.length < 2) return false;

  // Thread must be at least 1 day old
  const days = getDaysSince(thread.createdAt);
  if (days < 1) return false;

  // Must have some views
  if (views < 20) return false;

  // Probabilistic approval (40% of qualifying answers)
  return Math.random() < 0.4;
}

// Process threads
console.log('Processing threads...');
const processedThreads = threads.map(thread => {
  const threadPosts = posts.filter(p => p.threadId === thread.id);
  const aiAnswer = aiAnswers.find(a => a.id === thread.aiAnswerId);
  const course = courseLookup[thread.courseId];

  const views = calculateThreadViews(thread, threadPosts, aiAnswer, course);

  return {
    ...thread,
    views
  };
});

// Process posts (endorsements)
console.log('Processing posts...');
// Create a simple author lookup (we don't have users.json loaded, so we'll infer roles from IDs)
const processedPosts = posts.map(post => {
  const thread = processedThreads.find(t => t.id === post.threadId);

  // Infer author role from ID
  let author = { role: 'student' };
  if (post.authorId.includes('instructor')) {
    author.role = 'instructor';
  } else if (post.authorId.includes('ta')) {
    author.role = 'ta';
  }

  const probability = calculatePostEndorsementProbability(post, thread, author);
  const endorsed = Math.random() < probability;

  return {
    ...post,
    endorsed
  };
});

// Process AI answers (endorsements)
console.log('Processing AI answers...');
const processedAiAnswers = aiAnswers.map(aiAnswer => {
  const thread = processedThreads.find(t => t.aiAnswerId === aiAnswer.id);
  const views = thread ? thread.views : 20; // Fallback

  const studentEndorsements = calculateStudentEndorsements(aiAnswer, views);
  const instructorEndorsed = shouldInstructorEndorse(aiAnswer, thread, views);
  const instructorEndorsements = instructorEndorsed ? 1 : 0;

  // Total with boost if instructor endorsed
  let totalEndorsements = studentEndorsements + instructorEndorsements;
  if (instructorEndorsed && studentEndorsements > 0) {
    totalEndorsements += Math.floor(studentEndorsements * 0.3);
  }

  return {
    ...aiAnswer,
    studentEndorsements,
    instructorEndorsements,
    totalEndorsements,
    instructorEndorsed
  };
});

// Save processed data
console.log('\nSaving processed data...');
writeFileSync(
  join(__dirname, 'threads-with-metrics.json'),
  JSON.stringify(processedThreads, null, 2)
);

writeFileSync(
  join(__dirname, 'posts-with-endorsements.json'),
  JSON.stringify(processedPosts, null, 2)
);

writeFileSync(
  join(__dirname, 'ai-answers-with-endorsements.json'),
  JSON.stringify(processedAiAnswers, null, 2)
);

// Calculate statistics
console.log('\n=== ENGAGEMENT METRICS SUMMARY ===\n');

// View statistics
const viewStats = {
  min: Math.min(...processedThreads.map(t => t.views)),
  max: Math.max(...processedThreads.map(t => t.views)),
  avg: Math.round(processedThreads.reduce((sum, t) => sum + t.views, 0) / processedThreads.length)
};

console.log('VIEW DISTRIBUTION:');
console.log(`  Min views: ${viewStats.min}`);
console.log(`  Max views: ${viewStats.max}`);
console.log(`  Avg views: ${viewStats.avg}`);

// Views by status
const viewsByStatus = {
  open: processedThreads.filter(t => t.status === 'open').map(t => t.views),
  answered: processedThreads.filter(t => t.status === 'answered').map(t => t.views),
  resolved: processedThreads.filter(t => t.status === 'resolved').map(t => t.views)
};

console.log('\nVIEWS BY STATUS:');
Object.keys(viewsByStatus).forEach(status => {
  const views = viewsByStatus[status];
  if (views.length > 0) {
    const avg = Math.round(views.reduce((a, b) => a + b, 0) / views.length);
    console.log(`  ${status}: avg ${avg} (${views.length} threads)`);
  }
});

// Post endorsement statistics
const endorsedPosts = processedPosts.filter(p => p.endorsed).length;
const endorsementRate = ((endorsedPosts / processedPosts.length) * 100).toFixed(1);

console.log('\nPOST ENDORSEMENTS:');
console.log(`  Total posts: ${processedPosts.length}`);
console.log(`  Endorsed: ${endorsedPosts} (${endorsementRate}%)`);

// Endorsement by role
const postsByRole = {
  instructor: processedPosts.filter(p => p.authorId.includes('instructor')),
  ta: processedPosts.filter(p => p.authorId.includes('ta')),
  student: processedPosts.filter(p => !p.authorId.includes('instructor') && !p.authorId.includes('ta'))
};

console.log('\nENDORSEMENT RATE BY ROLE:');
Object.keys(postsByRole).forEach(role => {
  const rolePosts = postsByRole[role];
  if (rolePosts.length > 0) {
    const endorsed = rolePosts.filter(p => p.endorsed).length;
    const rate = ((endorsed / rolePosts.length) * 100).toFixed(1);
    console.log(`  ${role}: ${endorsed}/${rolePosts.length} (${rate}%)`);
  }
});

// AI answer endorsement statistics
console.log('\nAI ANSWER ENDORSEMENTS:');

const aiByConfidence = {
  high: processedAiAnswers.filter(a => a.confidenceScore >= 85),
  medium: processedAiAnswers.filter(a => a.confidenceScore >= 60 && a.confidenceScore < 85),
  low: processedAiAnswers.filter(a => a.confidenceScore < 60)
};

Object.keys(aiByConfidence).forEach(tier => {
  const answers = aiByConfidence[tier];
  if (answers.length > 0) {
    const avgStudent = Math.round(answers.reduce((sum, a) => sum + a.studentEndorsements, 0) / answers.length);
    const avgTotal = Math.round(answers.reduce((sum, a) => sum + a.totalEndorsements, 0) / answers.length);
    const instructorCount = answers.filter(a => a.instructorEndorsed).length;
    console.log(`  ${tier} confidence (${answers.length} answers):`);
    console.log(`    Avg student endorsements: ${avgStudent}`);
    console.log(`    Avg total endorsements: ${avgTotal}`);
    console.log(`    Instructor endorsed: ${instructorCount}`);
  }
});

// Quality correlation examples
console.log('\nQUALITY CORRELATION EXAMPLES:');

// High-view threads
const topThreads = [...processedThreads].sort((a, b) => b.views - a.views).slice(0, 3);
topThreads.forEach(thread => {
  const aiAnswer = processedAiAnswers.find(a => a.id === thread.aiAnswerId);
  const endorsements = aiAnswer ? aiAnswer.totalEndorsements : 0;
  const confidence = aiAnswer ? aiAnswer.confidenceScore : 0;
  console.log(`  Thread "${thread.title.slice(0, 50)}..."`);
  console.log(`    Views: ${thread.views}, Status: ${thread.status}, AI confidence: ${confidence}, Endorsements: ${endorsements}`);
});

console.log('\n=== FILES SAVED ===');
console.log('  artifacts/threads-with-metrics.json');
console.log('  artifacts/posts-with-endorsements.json');
console.log('  artifacts/ai-answers-with-endorsements.json');
console.log('\nDone!\n');
