#!/usr/bin/env node
/**
 * Backend Integration Test Script
 *
 * Tests all 9 backend modules with comprehensive logging
 *
 * Usage:
 *   node scripts/test-backend-integration.mjs
 *
 * Requirements:
 *   - Backend server running on http://localhost:3001
 *   - Database seeded with mock data
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const chalk = require('chalk');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test configuration
const TESTS_TO_RUN = {
  materials: true,
  aiAnswers: true,
  conversations: true,
  instructor: true,
  notifications: true,
  auth: true,
  courses: true,
  threads: true,
  posts: true,
};

// Test state
let testsPassed = 0;
let testsFailed = 0;
let testResults = [];

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;

  switch (level) {
    case 'success':
      console.log(chalk.green(`${prefix} ✅ ${message}`));
      break;
    case 'error':
      console.log(chalk.red(`${prefix} ❌ ${message}`));
      break;
    case 'warn':
      console.log(chalk.yellow(`${prefix} ⚠️  ${message}`));
      break;
    case 'info':
      console.log(chalk.blue(`${prefix} ℹ️  ${message}`));
      break;
    case 'header':
      console.log(chalk.bold.cyan(`\n${'='.repeat(80)}`));
      console.log(chalk.bold.cyan(`${prefix} ${message}`));
      console.log(chalk.bold.cyan(`${'='.repeat(80)}\n`));
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

async function makeRequest(method, endpoint, body = null, headers = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  log(`${method} ${endpoint}`, 'info');

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      log(`Response: ${response.status} ${response.statusText}`, 'success');
      return { success: true, status: response.status, data };
    } else {
      log(`Response: ${response.status} ${response.statusText}`, 'error');
      return { success: false, status: response.status, data };
    }
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

function recordTest(module, testName, passed, details = '') {
  testResults.push({ module, testName, passed, details });
  if (passed) {
    testsPassed++;
    log(`${module} - ${testName}: PASSED ${details}`, 'success');
  } else {
    testsFailed++;
    log(`${module} - ${testName}: FAILED ${details}`, 'error');
  }
}

// ============================================================================
// TEST MODULES
// ============================================================================

async function testMaterialsModule() {
  log('Testing Materials Module', 'header');

  // Test 1: Get materials for a course
  const res1 = await makeRequest('GET', '/materials?courseId=course-cs101');
  recordTest('Materials', 'GET /materials?courseId=course-cs101',
    res1.success && res1.data && Array.isArray(res1.data.items),
    res1.success && res1.data.items ? `(${res1.data.items.length} materials)` : ''
  );

  // Test 2: Get single material
  if (res1.success && res1.data.items && res1.data.items.length > 0) {
    const materialId = res1.data.items[0].id;
    const res2 = await makeRequest('GET', `/materials/${materialId}`);
    recordTest('Materials', `GET /materials/${materialId}`,
      res2.success && res2.data.id === materialId
    );
  }
}

async function testAIAnswersModule() {
  log('Testing AI Answers Module', 'header');

  // Test 1: Get AI answers for a thread
  const res1 = await makeRequest('GET', '/ai-answers?threadId=thread-1');
  recordTest('AI Answers', 'GET /ai-answers?threadId=thread-1',
    res1.success && (Array.isArray(res1.data) || res1.data !== null)
  );

  // Test 2: Get single AI answer
  const res2 = await makeRequest('GET', '/ai-answers/ai-answer-1');
  recordTest('AI Answers', 'GET /ai-answers/ai-answer-1',
    res2.success && res2.data.id === 'ai-answer-1'
  );

  // Test 3: Endorse AI answer
  const res3 = await makeRequest('POST', '/ai-answers/ai-answer-1/endorse');
  recordTest('AI Answers', 'POST /ai-answers/:id/endorse', res3.success);

  // Test 4: Get citations for AI answer
  const res4 = await makeRequest('GET', '/ai-answers/ai-answer-1/citations');
  recordTest('AI Answers', 'GET /ai-answers/:id/citations',
    res4.success && Array.isArray(res4.data),
    res4.success ? `(${res4.data.length} citations)` : ''
  );
}

async function testConversationsModule() {
  log('Testing Conversations Module', 'header');

  // Test 1: Get conversations for a user
  const res1 = await makeRequest('GET', '/conversations?userId=user-student-1');
  recordTest('Conversations', 'GET /conversations?userId=user-student-1',
    res1.success && res1.data && Array.isArray(res1.data.conversations),
    res1.success && res1.data.conversations ? `(${res1.data.conversations.length} conversations)` : ''
  );

  // Test 2: Get single conversation
  const res2 = await makeRequest('GET', '/conversations/conv-1');
  recordTest('Conversations', 'GET /conversations/conv-1',
    res2.success && res2.data.id === 'conv-1'
  );

  // Test 3: Get messages for a conversation
  const res3 = await makeRequest('GET', '/conversations/conv-1/messages');
  recordTest('Conversations', 'GET /conversations/:id/messages',
    res3.success && res3.data && Array.isArray(res3.data.messages),
    res3.success && res3.data.messages ? `(${res3.data.messages.length} messages)` : ''
  );

  // Test 4: Create new conversation
  const res4 = await makeRequest('POST', '/conversations', {
    userId: 'user-student-1',
    courseId: 'course-cs101',
    title: 'Test Conversation'
  });
  recordTest('Conversations', 'POST /conversations', res4.success);

  // Test 5: Send message (if conversation created)
  if (res4.success) {
    const conversationId = res4.data.id;
    const res5 = await makeRequest('POST', `/conversations/${conversationId}/messages`, {
      conversationId,
      userId: 'user-student-1',
      role: 'user',
      content: 'This is a test message'
    });
    recordTest('Conversations', 'POST /conversations/:id/messages', res5.success);

    // Test 6: Delete the test conversation
    const res6 = await makeRequest('DELETE', `/conversations/${conversationId}`);
    recordTest('Conversations', 'DELETE /conversations/:id', res6.success);
  }
}

async function testInstructorModule() {
  log('Testing Instructor Module', 'header');

  // Test 1: Get metrics
  const res1 = await makeRequest('GET', '/instructor/metrics?courseId=course-cs101&timeRange=30d');
  recordTest('Instructor', 'GET /instructor/metrics',
    res1.success && res1.data.totalThreads !== undefined
  );

  // Test 2: Get unanswered threads
  const res2 = await makeRequest('GET', '/instructor/unanswered?courseId=course-cs101');
  recordTest('Instructor', 'GET /instructor/unanswered',
    res2.success && Array.isArray(res2.data),
    res2.success ? `(${res2.data.length} unanswered)` : ''
  );

  // Test 3: Get response templates
  const res3 = await makeRequest('GET', '/instructor/templates?userId=user-instructor-1');
  recordTest('Instructor', 'GET /instructor/templates',
    res3.success && res3.data && Array.isArray(res3.data.templates),
    res3.success && res3.data.templates ? `(${res3.data.templates.length} templates)` : ''
  );

  // Test 4: Create response template
  const res4 = await makeRequest('POST', '/instructor/templates', {
    userId: 'user-instructor-1',
    title: 'Test Template',
    content: 'This is a test template for {{TOPIC}}',
    category: 'general',
    tags: ['test']
  });
  recordTest('Instructor', 'POST /instructor/templates', res4.success);

  // Test 5: Delete template (if created)
  if (res4.success) {
    const templateId = res4.data.id;
    const res5 = await makeRequest('DELETE', `/instructor/templates/${templateId}`);
    recordTest('Instructor', 'DELETE /instructor/templates/:id', res5.success);
  }

  // Test 6: Get moderation queue
  const res6 = await makeRequest('GET', '/instructor/moderation-queue?courseId=course-cs101');
  recordTest('Instructor', 'GET /instructor/moderation-queue',
    res6.success && Array.isArray(res6.data)
  );
}

async function testNotificationsModule() {
  log('Testing Notifications Module', 'header');

  // Test 1: Get notifications for a user
  const res1 = await makeRequest('GET', '/notifications?userId=user-student-1');
  recordTest('Notifications', 'GET /notifications?userId=user-student-1',
    res1.success && res1.data && Array.isArray(res1.data.notifications),
    res1.success && res1.data.notifications ? `(${res1.data.notifications.length} notifications)` : ''
  );

  // Test 2: Get unread count
  const res2 = await makeRequest('GET', '/notifications/unread-count?userId=user-student-1');
  recordTest('Notifications', 'GET /notifications/unread-count',
    res2.success && res2.data && res2.data.unreadCount !== undefined,
    res2.success && res2.data ? `(${res2.data.unreadCount} unread)` : ''
  );

  // Test 3: Mark notification as read (using a notification from res1)
  if (res1.success && res1.data.notifications && res1.data.notifications.length > 0) {
    const notificationId = res1.data.notifications[0].id;
    const res3 = await makeRequest('PATCH', `/notifications/${notificationId}/read`);
    recordTest('Notifications', 'PATCH /notifications/:id/read', res3.success);
  }

  // Test 4: Mark all as read
  const res4 = await makeRequest('PATCH', '/notifications/mark-all-read', {
    userId: 'user-student-1'
  });
  recordTest('Notifications', 'PATCH /notifications/mark-all-read', res4.success);
}

async function testAuthModule() {
  log('Testing Auth Module', 'header');

  // Test 1: Get current user
  const res1 = await makeRequest('GET', '/auth/me');
  recordTest('Auth', 'GET /auth/me', res1.success && res1.data.id !== undefined);
}

async function testCoursesModule() {
  log('Testing Courses Module', 'header');

  // Test 1: Get all courses
  const res1 = await makeRequest('GET', '/courses');
  recordTest('Courses', 'GET /courses',
    res1.success && Array.isArray(res1.data),
    res1.success ? `(${res1.data.length} courses)` : ''
  );

  // Test 2: Get single course
  const res2 = await makeRequest('GET', '/courses/course-cs101');
  recordTest('Courses', 'GET /courses/course-cs101',
    res2.success && res2.data.id === 'course-cs101'
  );

  // Test 3: Get enrollments for a user
  const res3 = await makeRequest('GET', '/courses/enrollments?userId=user-student-1');
  recordTest('Courses', 'GET /courses/enrollments',
    res3.success && Array.isArray(res3.data),
    res3.success ? `(${res3.data.length} enrollments)` : ''
  );
}

async function testThreadsModule() {
  log('Testing Threads Module', 'header');

  // Test 1: Get threads for a course
  const res1 = await makeRequest('GET', '/threads?courseId=course-cs101');
  recordTest('Threads', 'GET /threads?courseId=course-cs101',
    res1.success && res1.data && Array.isArray(res1.data.items),
    res1.success && res1.data.items ? `(${res1.data.items.length} threads)` : ''
  );

  // Test 2: Get single thread
  const res2 = await makeRequest('GET', '/threads/thread-1');
  recordTest('Threads', 'GET /threads/thread-1',
    res2.success && res2.data.id === 'thread-1'
  );

  // Test 3: Create new thread
  const res3 = await makeRequest('POST', '/threads', {
    courseId: 'course-cs101',
    authorId: 'user-student-1',
    title: 'Test Thread',
    content: 'This is a test thread',
    tags: ['test']
  });
  recordTest('Threads', 'POST /threads', res3.success);

  // Test 4: Endorse thread (using test thread if created, or thread-1)
  const threadId = res3.success ? res3.data.id : 'thread-1';
  const res4 = await makeRequest('POST', `/threads/${threadId}/endorse`, {
    userId: 'user-instructor-1'
  });
  recordTest('Threads', 'POST /threads/:id/endorse', res4.success);

  // Test 5: Upvote thread
  const res5 = await makeRequest('POST', `/threads/${threadId}/upvote`, {
    userId: 'user-student-2'
  });
  recordTest('Threads', 'POST /threads/:id/upvote', res5.success);
}

async function testPostsModule() {
  log('Testing Posts Module', 'header');

  // Test 1: Get posts for a thread
  const res1 = await makeRequest('GET', '/posts?threadId=thread-1');
  recordTest('Posts', 'GET /posts?threadId=thread-1',
    res1.success && res1.data && Array.isArray(res1.data.items),
    res1.success && res1.data.items ? `(${res1.data.items.length} posts)` : ''
  );

  // Test 2: Create new post
  const res2 = await makeRequest('POST', '/posts', {
    threadId: 'thread-1',
    authorId: 'user-student-1',
    content: 'This is a test post',
    isInstructorAnswer: false
  });
  recordTest('Posts', 'POST /posts', res2.success);

  // Test 3: Endorse post (using test post if created, or first post from thread-1)
  let postId;
  if (res2.success) {
    postId = res2.data.id;
  } else if (res1.success && res1.data.length > 0) {
    postId = res1.data[0].id;
  }

  if (postId) {
    const res3 = await makeRequest('POST', `/posts/${postId}/endorse`, {
      userId: 'user-instructor-1'
    });
    recordTest('Posts', 'POST /posts/:id/endorse', res3.success);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log(chalk.bold.magenta('\n' + '█'.repeat(80)));
  console.log(chalk.bold.magenta('█' + ' '.repeat(78) + '█'));
  console.log(chalk.bold.magenta('█' + ' '.repeat(20) + 'BACKEND INTEGRATION TEST SUITE' + ' '.repeat(28) + '█'));
  console.log(chalk.bold.magenta('█' + ' '.repeat(78) + '█'));
  console.log(chalk.bold.magenta('█'.repeat(80) + '\n'));

  log('Starting backend integration tests...', 'info');
  log(`API Base URL: ${API_BASE_URL}`, 'info');
  log(`Testing ${Object.values(TESTS_TO_RUN).filter(Boolean).length} modules\n`, 'info');

  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/health`);
    if (!healthCheck.ok) {
      log('Backend server is not responding. Please start the server with: cd backend && npm run dev', 'error');
      process.exit(1);
    }
    log('Backend server is running', 'success');
  } catch (error) {
    log('Cannot connect to backend server. Please start it with: cd backend && npm run dev', 'error');
    process.exit(1);
  }

  // Run tests
  try {
    if (TESTS_TO_RUN.materials) await testMaterialsModule();
    if (TESTS_TO_RUN.aiAnswers) await testAIAnswersModule();
    if (TESTS_TO_RUN.conversations) await testConversationsModule();
    if (TESTS_TO_RUN.instructor) await testInstructorModule();
    if (TESTS_TO_RUN.notifications) await testNotificationsModule();
    if (TESTS_TO_RUN.auth) await testAuthModule();
    if (TESTS_TO_RUN.courses) await testCoursesModule();
    if (TESTS_TO_RUN.threads) await testThreadsModule();
    if (TESTS_TO_RUN.posts) await testPostsModule();
  } catch (error) {
    log(`Test suite crashed: ${error.message}`, 'error');
    console.error(error);
  }

  // Print summary
  log('Test Summary', 'header');

  const totalTests = testsPassed + testsFailed;
  const passRate = totalTests > 0 ? ((testsPassed / totalTests) * 100).toFixed(1) : 0;

  console.log(chalk.bold(`Total Tests: ${totalTests}`));
  console.log(chalk.green.bold(`Passed: ${testsPassed}`));
  console.log(chalk.red.bold(`Failed: ${testsFailed}`));
  console.log(chalk.bold(`Pass Rate: ${passRate}%\n`));

  // Group results by module
  const byModule = testResults.reduce((acc, result) => {
    if (!acc[result.module]) {
      acc[result.module] = { passed: 0, failed: 0 };
    }
    result.passed ? acc[result.module].passed++ : acc[result.module].failed++;
    return acc;
  }, {});

  console.log(chalk.bold('\nResults by Module:'));
  Object.entries(byModule).forEach(([module, stats]) => {
    const total = stats.passed + stats.failed;
    const rate = ((stats.passed / total) * 100).toFixed(0);
    const status = stats.failed === 0 ? chalk.green('✅') : chalk.yellow('⚠️');
    console.log(`${status} ${module.padEnd(20)} ${stats.passed}/${total} (${rate}%)`);
  });

  // Exit with appropriate code
  console.log('\n');
  if (testsFailed === 0) {
    log('All tests passed! 🎉', 'success');
    process.exit(0);
  } else {
    log(`${testsFailed} test(s) failed`, 'error');
    process.exit(1);
  }
}

// Run the tests
runTests();
