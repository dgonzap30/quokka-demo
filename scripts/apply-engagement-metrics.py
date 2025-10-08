#!/usr/bin/env python3
"""
Apply realistic engagement metrics to mock data based on quality and age.
Implements formulas from doccloud/tasks/mock-data-quality/research/engagement-patterns.md
"""

import json
import random
from datetime import datetime
from pathlib import Path

# Set seed for reproducible demo data
random.seed(42)

# Load data
base_path = Path(__file__).parent.parent / 'mocks'
threads = json.load(open(base_path / 'threads.json'))
posts = json.load(open(base_path / 'posts.json'))
ai_answers = json.load(open(base_path / 'ai-answers.json'))
courses = json.load(open(base_path / 'courses.json'))
users = json.load(open(base_path / 'users.json'))

# Create lookups
courses_by_id = {c['id']: c for c in courses}
posts_by_thread = {}
for post in posts:
    thread_id = post['threadId']
    if thread_id not in posts_by_thread:
        posts_by_thread[thread_id] = []
    posts_by_thread[thread_id].append(post)
ai_by_thread = {a['threadId']: a for a in ai_answers}
users_by_id = {u['id']: u for u in users}

# Demo "now" date
NOW = datetime(2025, 10, 7, 12, 0, 0)

def get_days_since_creation(created_at_str):
    created = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
    delta = NOW - created.replace(tzinfo=None)
    return delta.days

def get_course_size_factor(enrollment):
    if enrollment < 35:
        return 0.8  # small
    elif enrollment <= 50:
        return 1.0  # medium
    else:
        return 1.3  # large

def get_base_views(status):
    if status == 'resolved':
        return random.randint(20, 35)
    elif status == 'answered':
        return random.randint(15, 25)
    else:  # open
        return random.randint(8, 15)

def calculate_quality_factor(thread, thread_posts, ai_answer):
    score = 0.0

    # Has AI answer
    if thread.get('hasAIAnswer'):
        score += 0.3

    # Has replies
    if len(thread_posts) > 0:
        score += 0.2

    # Has endorsed posts
    if any(p.get('endorsed') for p in thread_posts):
        score += 0.3

    # Has instructor reply
    for post in thread_posts:
        author = users_by_id.get(post['authorId'])
        if author and author['role'] == 'instructor':
            score += 0.2
            break

    # Thread is resolved
    if thread['status'] == 'resolved':
        score += 0.25

    return 1.0 + score

def calculate_thread_views(thread):
    days = get_days_since_creation(thread['createdAt'])
    course = courses_by_id[thread['courseId']]
    thread_posts = posts_by_thread.get(thread['id'], [])
    ai_answer = ai_by_thread.get(thread['id'])

    base_views = get_base_views(thread['status'])
    age_factor = min(1 + (days / 7) * 0.5, 2.5)  # Cap at 2.5x
    quality_factor = calculate_quality_factor(thread, thread_posts, ai_answer)
    course_size_factor = get_course_size_factor(course['enrollmentCount'])

    calculated = int(base_views * age_factor * quality_factor * course_size_factor)
    return min(calculated, 200)  # Cap at 200

def calculate_ai_student_endorsements(ai_answer, thread_views):
    confidence = ai_answer['confidenceScore']

    if confidence >= 85:  # High confidence
        base = (confidence / 100) * (thread_views / 10) * random.uniform(0.3, 0.6)
    elif confidence >= 60:  # Medium confidence
        base = (confidence / 100) * (thread_views / 20) * random.uniform(0.2, 0.4)
    else:  # Low confidence
        base = random.uniform(0, 2)

    return max(0, int(base))

def should_instructor_endorse(ai_answer, thread_views, days_old):
    # Must be high confidence
    if ai_answer['confidenceScore'] < 80:
        return False

    # Must have quality citations
    quality_citations = [c for c in ai_answer['citations'] if c['relevance'] >= 80]
    if len(quality_citations) < 2:
        return False

    # Thread must have some age
    if days_old < 1:
        return False

    # Thread must have views
    if thread_views < 20:
        return False

    # 40% of qualifying answers get instructor endorsement
    return random.random() < 0.4

# Apply metrics to threads
print("Calculating thread views...")
for thread in threads:
    thread['views'] = calculate_thread_views(thread)
    print(f"  {thread['id']}: {thread['views']} views")

# Apply metrics to AI answers
print("\nCalculating AI answer endorsements...")
for ai_answer in ai_answers:
    thread = next(t for t in threads if t['id'] == ai_answer['threadId'])
    days_old = get_days_since_creation(thread['createdAt'])

    student_endorsements = calculate_ai_student_endorsements(ai_answer, thread['views'])
    instructor_endorsements = 1 if should_instructor_endorse(ai_answer, thread['views'], days_old) else 0

    ai_answer['studentEndorsements'] = student_endorsements
    ai_answer['instructorEndorsements'] = instructor_endorsements
    ai_answer['instructorEndorsed'] = instructor_endorsements > 0

    # Boost total if instructor endorsed
    total = student_endorsements + instructor_endorsements
    if instructor_endorsements > 0:
        total += int(student_endorsements * 0.3)

    ai_answer['totalEndorsements'] = total

    print(f"  {ai_answer['id']}: {student_endorsements} student, {instructor_endorsements} instructor, {total} total")

# Save updated data
print("\nSaving updated files...")
json.dump(threads, open(base_path / 'threads.json', 'w'), indent=2)
json.dump(posts, open(base_path / 'posts.json', 'w'), indent=2)
json.dump(ai_answers, open(base_path / 'ai-answers.json', 'w'), indent=2)

print("\n✓ Engagement metrics applied successfully!")
print(f"\nView distribution: {min(t['views'] for t in threads)}-{max(t['views'] for t in threads)} views")
print(f"Average views: {sum(t['views'] for t in threads) / len(threads):.0f}")
print(f"Endorsed posts: {sum(1 for p in posts if p.get('endorsed', False))}/{len(posts)} ({sum(1 for p in posts if p.get('endorsed', False))/len(posts)*100:.1f}%)")
print(f"AI answers with instructor endorsement: {sum(1 for a in ai_answers if a['instructorEndorsed'])}/{len(ai_answers)}")
