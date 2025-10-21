#!/usr/bin/env node
/**
 * Mock Data Enhancement Script
 *
 * Enhances existing mock data with:
 * - Realistic view counts based on thread age
 * - Better post distribution (2-15 replies per thread)
 * - Additional posts to reach 100-200 total
 * - Endorsements and upvotes on quality threads
 * - Improved AI answer quality
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MOCKS_DIR = join(__dirname, '../mocks');

// Load JSON files
function loadJSON(filename) {
  const path = join(MOCKS_DIR, filename);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// Save JSON files
function saveJSON(filename, data) {
  const path = join(MOCKS_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

// Generate UUID
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Calculate realistic view count based on thread age and reply count
function calculateViewCount(createdAt, replyCount) {
  const now = new Date();
  const created = new Date(createdAt);
  const ageInDays = (now - created) / (1000 * 60 * 60 * 24);

  // Base views: 10-50 per day
  const baseViews = Math.floor(ageInDays * (10 + Math.random() * 40));

  // Engagement multiplier: threads with more replies get more views
  const engagementMultiplier = 1 + (replyCount * 0.2);

  return Math.max(1, Math.floor(baseViews * engagementMultiplier));
}

// Generate realistic post content
function generatePostContent(threadTitle, postIndex, totalPosts, authorRole) {
  const isFirstReply = postIndex === 0;
  const isMiddleDiscussion = postIndex > 0 && postIndex < totalPosts - 2;
  const isLateReply = postIndex >= totalPosts - 2;

  if (authorRole === 'instructor' || authorRole === 'ta') {
    return `Thanks for your question! ${
      isFirstReply
        ? `Let me explain this concept in detail. The key point to understand is that this requires careful consideration of the fundamentals we covered in lecture.`
        : `I'd like to add some clarification here. Make sure you understand the underlying principles before moving forward.`
    }`;
  }

  if (isFirstReply) {
    return `I was confused about this too! Here's what I found after looking through the course materials...`;
  }

  if (isMiddleDiscussion) {
    return `That makes sense! Just to build on that point, I think we also need to consider...`;
  }

  return `This discussion has been really helpful. I think I understand it now, thanks everyone!`;
}

// Main enhancement function
async function enhanceData() {
  console.log('🚀 Starting mock data enhancement...\n');

  // Load data
  const users = loadJSON('users.json');
  const threads = loadJSON('threads.json');
  const posts = loadJSON('posts.json');
  const aiAnswers = loadJSON('ai-answers.json');

  console.log('📊 Current state:');
  console.log(`  - ${users.length} users`);
  console.log(`  - ${threads.length} threads`);
  console.log(`  - ${posts.length} posts`);
  console.log(`  - ${aiAnswers.length} AI answers\n`);

  // Get student and instructor IDs
  const students = users.filter(u => u.role === 'student').map(u => u.id);
  const instructors = users.filter(u => u.role === 'instructor').map(u => u.id);
  const tas = users.filter(u => u.role === 'ta').map(u => u.id);

  // Step 1: Distribute existing posts better and generate new ones
  console.log('📝 Enhancing posts...');
  const newPosts = [...posts];
  let postsAdded = 0;

  // Target: each thread should have 0-15 replies (varied distribution)
  for (const thread of threads) {
    const existingPosts = newPosts.filter(p => p.threadId === thread.id);
    const existingCount = existingPosts.length;

    // Determine target reply count (weighted distribution)
    let targetReplies;
    const rand = Math.random();
    if (rand < 0.15) {
      targetReplies = 0; // 15% have no replies (unanswered)
    } else if (rand < 0.35) {
      targetReplies = 1 + Math.floor(Math.random() * 2); // 20% have 1-2 replies
    } else if (rand < 0.60) {
      targetReplies = 3 + Math.floor(Math.random() * 4); // 25% have 3-6 replies
    } else if (rand < 0.85) {
      targetReplies = 7 + Math.floor(Math.random() * 5); // 25% have 7-11 replies
    } else {
      targetReplies = 12 + Math.floor(Math.random() * 4); // 15% have 12-15 replies
    }

    // Generate additional posts if needed
    const neededPosts = Math.max(0, targetReplies - existingCount);

    if (neededPosts > 0) {
      const threadCreatedAt = new Date(thread.createdAt);

      for (let i = 0; i < neededPosts; i++) {
        // Stagger timestamps after thread creation
        const hoursAfter = (existingCount + i + 1) * (2 + Math.random() * 10);
        const postTime = new Date(threadCreatedAt.getTime() + hoursAfter * 60 * 60 * 1000);

        // Mix of students, TAs, and instructors
        let authorId;
        const authorRand = Math.random();
        if (authorRand < 0.70) {
          // 70% student responses
          authorId = students[Math.floor(Math.random() * students.length)];
        } else if (authorRand < 0.90) {
          // 20% TA responses
          authorId = tas[Math.floor(Math.random() * tas.length)];
        } else {
          // 10% instructor responses
          authorId = instructors[Math.floor(Math.random() * instructors.length)];
        }

        const author = users.find(u => u.id === authorId);
        const content = generatePostContent(
          thread.title,
          existingCount + i,
          targetReplies,
          author.role
        );

        newPosts.push({
          id: generateId('post'),
          threadId: thread.id,
          authorId,
          content,
          isInstructorAnswer: author.role === 'instructor',
          endorsedBy: [],
          createdAt: postTime.toISOString(),
          updatedAt: postTime.toISOString()
        });

        postsAdded++;
      }
    }

    // Update thread reply count and view count
    const finalPostCount = newPosts.filter(p => p.threadId === thread.id).length;
    thread.replyCount = finalPostCount;
    thread.viewCount = calculateViewCount(thread.createdAt, finalPostCount);
  }

  console.log(`  ✅ Added ${postsAdded} new posts (${newPosts.length} total)\n`);

  // Step 2: Add endorsements and upvotes to high-quality threads
  console.log('⭐ Adding endorsements and upvotes...');
  let endorsementsAdded = 0;
  let upvotesAdded = 0;

  // Sort threads by reply count (quality signal)
  const sortedThreads = [...threads].sort((a, b) => b.replyCount - a.replyCount);

  // Top 20% get endorsements from instructors/TAs
  const topThreads = sortedThreads.slice(0, Math.ceil(threads.length * 0.2));
  for (const thread of topThreads) {
    if (!thread.endorsedBy) thread.endorsedBy = [];

    // Add 1-2 endorsements
    const numEndorsements = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numEndorsements && i < (instructors.length + tas.length); i++) {
      const endorserId = i < instructors.length
        ? instructors[i]
        : tas[i - instructors.length];

      if (!thread.endorsedBy.includes(endorserId)) {
        thread.endorsedBy.push(endorserId);
        endorsementsAdded++;
      }
    }
  }

  // Top 40% get student upvotes
  const upvoteThreads = sortedThreads.slice(0, Math.ceil(threads.length * 0.4));
  for (const thread of upvoteThreads) {
    if (!thread.upvotedBy) thread.upvotedBy = [];

    // Add 2-8 upvotes
    const numUpvotes = 2 + Math.floor(Math.random() * 7);
    const availableStudents = students.filter(s => !thread.upvotedBy.includes(s));

    for (let i = 0; i < Math.min(numUpvotes, availableStudents.length); i++) {
      const upvoter = availableStudents[Math.floor(Math.random() * availableStudents.length)];
      if (!thread.upvotedBy.includes(upvoter)) {
        thread.upvotedBy.push(upvoter);
        upvotesAdded++;
      }
    }
  }

  console.log(`  ✅ Added ${endorsementsAdded} endorsements and ${upvotesAdded} upvotes\n`);

  // Save enhanced data
  console.log('💾 Saving enhanced data...');
  saveJSON('threads.json', threads);
  saveJSON('posts.json', newPosts);

  console.log('\n✨ Enhancement complete!');
  console.log('\n📊 Final state:');
  console.log(`  - ${users.length} users (unchanged)`);
  console.log(`  - ${threads.length} threads`);
  console.log(`  - ${newPosts.length} posts (+${postsAdded})`);
  console.log(`  - ${threads.filter(t => t.replyCount === 0).length} unanswered threads`);
  console.log(`  - ${threads.filter(t => t.replyCount >= 10).length} highly engaged threads (10+ replies)`);
  console.log(`  - ${threads.filter(t => t.endorsedBy && t.endorsedBy.length > 0).length} endorsed threads`);
  console.log(`  - ${threads.filter(t => t.upvotedBy && t.upvotedBy.length > 0).length} upvoted threads`);

  console.log('\n🎉 Run "cd backend && npm run db:seed" to apply changes to database');
}

// Run enhancement
enhanceData().catch(console.error);
