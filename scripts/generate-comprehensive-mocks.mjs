#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mocksDir = join(__dirname, '..', 'mocks');

console.log('🚀 Generating comprehensive mock data...\n');

// Helper to generate IDs
const genId = (prefix, index) => `${prefix}-${index}`;

// Helper to generate dates
const genDate = (daysAgo, hoursOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
};

// ===== AI ANSWERS =====
console.log('📝 Generating AI answers (30 items)...');

const aiAnswers = [
  // High confidence CS answers
  ...Array.from({ length: 10 }, (_, i) => ({
    id: genId('ai-answer', i + 1),
    threadId: genId('thread', i + 1),
    courseId: i < 5 ? 'course-cs101' : 'course-cs201',
    content: `This is a comprehensive AI-generated answer for thread ${i + 1}. The answer provides detailed explanations with code examples and references to course materials.`,
    confidenceLevel: 'high',
    confidenceScore: 85 + Math.floor(Math.random() * 10),
    citations: [
      {
        id: genId('cite', `${i + 1}-1`),
        sourceType: 'lecture',
        source: `Lecture ${i + 3}: Key Concepts`,
        excerpt: 'Relevant excerpt from lecture materials...',
        relevance: 88 + Math.floor(Math.random() * 10),
        link: null
      },
      {
        id: genId('cite', `${i + 1}-2`),
        sourceType: 'textbook',
        source: 'Course Textbook - Chapter ' + (i + 2),
        excerpt: 'Supporting material from textbook...',
        relevance: 80 + Math.floor(Math.random() * 15),
        link: null
      }
    ],
    studentEndorsements: Math.floor(Math.random() * 5),
    instructorEndorsements: i % 3 === 0 ? 1 : 0,
    totalEndorsements: Math.floor(Math.random() * 8),
    endorsedBy: [],
    instructorEndorsed: i % 3 === 0,
    generatedAt: genDate(20 - i, i),
    updatedAt: genDate(20 - i, i + 1)
  })),

  // Medium confidence answers
  ...Array.from({ length: 12 }, (_, i) => ({
    id: genId('ai-answer', i + 11),
    threadId: genId('thread', i + 11),
    courseId: ['course-math221', 'course-cs301', 'course-phys201'][i % 3],
    content: `This answer provides a good starting point for thread ${i + 11}. Additional clarification may be needed for specific details.`,
    confidenceLevel: 'medium',
    confidenceScore: 55 + Math.floor(Math.random() * 15),
    citations: [
      {
        id: genId('cite', `${i + 11}-1`),
        sourceType: i % 2 === 0 ? 'slides' : 'reading',
        source: i % 2 === 0 ? `Slides: Topic ${i + 1}` : `Reading ${i + 1}`,
        excerpt: 'Related content from course materials...',
        relevance: 65 + Math.floor(Math.random() * 20),
        link: null
      }
    ],
    studentEndorsements: Math.floor(Math.random() * 3),
    instructorEndorsements: 0,
    totalEndorsements: Math.floor(Math.random() * 3),
    endorsedBy: [],
    instructorEndorsed: false,
    generatedAt: genDate(15 - Math.floor(i / 2), i),
    updatedAt: genDate(15 - Math.floor(i / 2), i + 1)
  })),

  // Low confidence answers
  ...Array.from({ length: 8 }, (_, i) => ({
    id: genId('ai-answer', i + 23),
    threadId: genId('thread', i + 23),
    courseId: ['course-eng101', 'course-phys201'][i % 2],
    content: `This is a preliminary answer for thread ${i + 23}. More specific information from the instructor may be needed.`,
    confidenceLevel: 'low',
    confidenceScore: 35 + Math.floor(Math.random() * 10),
    citations: [
      {
        id: genId('cite', `${i + 23}-1`),
        sourceType: 'assignment',
        source: `Assignment ${i + 1} Guidelines`,
        excerpt: 'Partially relevant information...',
        relevance: 50 + Math.floor(Math.random() * 15),
        link: null
      }
    ],
    studentEndorsements: 0,
    instructorEndorsements: 0,
    totalEndorsements: 0,
    endorsedBy: [],
    instructorEndorsed: false,
    generatedAt: genDate(10 - i, i),
    updatedAt: genDate(10 - i, i)
  }))
];

writeFileSync(join(mocksDir, 'ai-answers.json'), JSON.stringify(aiAnswers, null, 2));
console.log('✅ ai-answers.json created (30 items)\n');

// ===== THREADS =====
console.log('📝 Generating threads (35 items)...');

const courseIds = ['course-cs101', 'course-cs201', 'course-math221', 'course-cs301', 'course-phys201', 'course-eng101'];
const statuses = ['open', 'answered', 'resolved'];

const threadTopics = {
  'course-cs101': [
    { title: 'How does binary search work?', tags: ['algorithms', 'binary-search'] },
    { title: 'What is recursion?', tags: ['recursion', 'functions'] },
    { title: 'Understanding loops vs recursion', tags: ['loops', 'recursion'] },
    { title: 'How to debug segmentation faults?', tags: ['debugging', 'pointers'] },
    { title: 'Best practices for variable naming?', tags: ['style', 'best-practices'] }
  ],
  'course-cs201': [
    { title: 'Understanding Big O notation', tags: ['algorithms', 'complexity'] },
    { title: 'When to use hash tables?', tags: ['data-structures', 'hash-tables'] },
    { title: 'Graph traversal: DFS vs BFS', tags: ['graphs', 'algorithms'] },
    { title: 'Dynamic programming basics', tags: ['dynamic-programming', 'optimization'] },
    { title: 'Balancing binary search trees', tags: ['trees', 'data-structures'] }
  ],
  'course-math221': [
    { title: 'Integration by parts confusion', tags: ['integration', 'calculus'] },
    { title: 'When to use u-substitution?', tags: ['integration', 'techniques'] },
    { title: 'Understanding series convergence', tags: ['series', 'convergence'] },
    { title: 'Partial fractions help', tags: ['integration', 'partial-fractions'] },
    { title: 'Limits at infinity', tags: ['limits', 'calculus'] }
  ],
  'course-cs301': [
    { title: 'NP-completeness proof strategies', tags: ['complexity', 'np-complete'] },
    { title: 'Approximation algorithms', tags: ['algorithms', 'approximation'] },
    { title: 'Graph coloring problem', tags: ['graphs', 'optimization'] }
  ],
  'course-phys201': [
    { title: 'Electric field vs electric potential', tags: ['electricity', 'fields'] },
    { title: 'Understanding Kirchhoff\'s laws', tags: ['circuits', 'laws'] },
    { title: 'Magnetic flux calculation', tags: ['magnetism', 'flux'] }
  ],
  'course-eng101': [
    { title: 'How to structure a research paper?', tags: ['writing', 'research'] },
    { title: 'Citing sources in MLA format', tags: ['citations', 'mla'] },
    { title: 'Thesis statement tips', tags: ['writing', 'thesis'] }
  ]
};

const threads = [];
let threadIndex = 1;

courseIds.forEach((courseId, courseIdx) => {
  const topics = threadTopics[courseId] || [];
  topics.forEach((topic, topicIdx) => {
    const daysAgo = 25 - threadIndex;
    const status = threadIndex <= 10 ? 'open' : (threadIndex <= 25 ? 'answered' : 'resolved');
    const hasAI = threadIndex <= 30;

    threads.push({
      id: genId('thread', threadIndex),
      courseId,
      title: topic.title,
      content: `This is a detailed question about ${topic.title.toLowerCase()}. I've read the course materials but need clarification on specific aspects.`,
      authorId: genId('user-student', (threadIndex % 14) + 1),
      status,
      tags: topic.tags,
      views: Math.floor(Math.random() * 100) + 10,
      createdAt: genDate(daysAgo, topicIdx),
      updatedAt: genDate(Math.max(0, daysAgo - 1), topicIdx + 2),
      hasAIAnswer: hasAI,
      aiAnswerId: hasAI ? genId('ai-answer', threadIndex) : undefined
    });

    threadIndex++;
  });
});

writeFileSync(join(mocksDir, 'threads.json'), JSON.stringify(threads, null, 2));
console.log(`✅ threads.json created (${threads.length} items)\n`);

// ===== POSTS =====
console.log('📝 Generating posts (80 items)...');

const posts = [];
let postIndex = 1;

threads.forEach((thread, threadIdx) => {
  const numPosts = Math.floor(Math.random() * 4) + 1; // 1-4 posts per thread

  for (let i = 0; i < numPosts; i++) {
    const authorRole = i === 0 && Math.random() > 0.6 ? 'ta' : 'student';
    const authorId = authorRole === 'ta'
      ? genId('user-ta', (postIndex % 3) + 1)
      : genId('user-student', (postIndex % 14) + 1);

    const endorsed = i === 0 && Math.random() > 0.5;
    const flagged = Math.random() > 0.95;

    posts.push({
      id: genId('post', postIndex),
      threadId: thread.id,
      authorId,
      content: `This is reply #${i + 1} to thread ${thread.id}. ${endorsed ? 'This answer provides helpful clarification on the topic.' : 'Here are my thoughts on this question.'}`,
      endorsed,
      flagged,
      createdAt: genDate(24 - threadIdx, i * 2),
      updatedAt: genDate(24 - threadIdx, i * 2 + 1)
    });

    postIndex++;
  }
});

writeFileSync(join(mocksDir, 'posts.json'), JSON.stringify(posts, null, 2));
console.log(`✅ posts.json created (${posts.length} items)\n`);

// ===== NOTIFICATIONS =====
console.log('📝 Generating notifications (40 items)...');

const notificationTypes = [
  'new_thread',
  'new_post',
  'endorsed',
  'resolved',
  'ai_answer_ready',
  'ai_answer_endorsed'
];

const notifications = [];
for (let i = 0; i < 40; i++) {
  const type = notificationTypes[i % notificationTypes.length];
  const userId = genId('user-student', (i % 14) + 1);
  const courseId = courseIds[i % courseIds.length];
  const threadId = genId('thread', (i % threads.length) + 1);

  notifications.push({
    id: genId('notification', i + 1),
    userId,
    courseId,
    threadId: Math.random() > 0.2 ? threadId : undefined,
    type,
    content: `Notification ${i + 1}: ${type.replace('_', ' ')}`,
    read: i < 25, // First 25 are read
    createdAt: genDate(Math.floor(i / 4), i % 4)
  });
}

writeFileSync(join(mocksDir, 'notifications.json'), JSON.stringify(notifications, null, 2));
console.log(`✅ notifications.json created (40 items)\n`);

// ===== ENROLLMENTS =====
console.log('📝 Generating enrollments (60 items)...');

const enrollments = [];
let enrollId = 1;

// Enroll students in 2-4 courses each
for (let studentNum = 1; studentNum <= 14; studentNum++) {
  const numCourses = Math.floor(Math.random() * 3) + 2; // 2-4 courses
  const enrolledCourses = new Set();

  while (enrolledCourses.size < numCourses) {
    const courseId = courseIds[Math.floor(Math.random() * courseIds.length)];
    if (!enrolledCourses.has(courseId)) {
      enrolledCourses.add(courseId);
      enrollments.push({
        id: genId('enroll', enrollId++),
        userId: genId('user-student', studentNum),
        courseId,
        role: 'student',
        enrolledAt: genDate(40 - studentNum, studentNum)
      });
    }
  }
}

// Enroll instructors
enrollments.push(
  { id: genId('enroll', enrollId++), userId: 'user-instructor-1', courseId: 'course-cs101', role: 'instructor', enrolledAt: genDate(50, 0) },
  { id: genId('enroll', enrollId++), userId: 'user-instructor-1', courseId: 'course-cs201', role: 'instructor', enrolledAt: genDate(50, 0) },
  { id: genId('enroll', enrollId++), userId: 'user-instructor-1', courseId: 'course-cs301', role: 'instructor', enrolledAt: genDate(50, 0) },
  { id: genId('enroll', enrollId++), userId: 'user-instructor-2', courseId: 'course-math221', role: 'instructor', enrolledAt: genDate(50, 0) },
  { id: genId('enroll', enrollId++), userId: 'user-instructor-2', courseId: 'course-cs301', role: 'instructor', enrolledAt: genDate(50, 0) },
  { id: genId('enroll', enrollId++), userId: 'user-instructor-3', courseId: 'course-phys201', role: 'instructor', enrolledAt: genDate(50, 0) },
  { id: genId('enroll', enrollId++), userId: 'user-instructor-3', courseId: 'course-eng101', role: 'instructor', enrolledAt: genDate(50, 0) }
);

// Enroll TAs
enrollments.push(
  { id: genId('enroll', enrollId++), userId: 'user-ta-1', courseId: 'course-cs101', role: 'ta', enrolledAt: genDate(45, 0) },
  { id: genId('enroll', enrollId++), userId: 'user-ta-2', courseId: 'course-cs201', role: 'ta', enrolledAt: genDate(45, 0) },
  { id: genId('enroll', enrollId++), userId: 'user-ta-3', courseId: 'course-math221', role: 'ta', enrolledAt: genDate(45, 0) }
);

writeFileSync(join(mocksDir, 'enrollments.json'), JSON.stringify(enrollments, null, 2));
console.log(`✅ enrollments.json created (${enrollments.length} items)\n`);

console.log('🎉 Mock data generation complete!');
console.log('\nSummary:');
console.log(`  - AI Answers: 30`);
console.log(`  - Threads: ${threads.length}`);
console.log(`  - Posts: ${posts.length}`);
console.log(`  - Notifications: 40`);
console.log(`  - Enrollments: ${enrollments.length}`);
console.log('\nNext: Update lib/store/localStore.ts to seed the new data files.\n');
