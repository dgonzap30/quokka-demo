# Task: Comprehensive Mock Data Quality Improvement

**Goal:** Transform generic, templated mock data into realistic, domain-specific academic Q&A content that showcases the platform's capabilities.

**In-Scope:**
- `mocks/threads.json` - 24 thread questions
- `mocks/posts.json` - 53 replies
- `mocks/ai-answers.json` - 30 AI-generated answers
- Citation excerpts and quality patterns
- Engagement metrics (views, endorsements)

**Out-of-Scope:**
- `mocks/users.json` (already realistic)
- `mocks/courses.json` (adequate quality)
- `mocks/enrollments.json`
- `mocks/notifications.json`
- JSON structure changes (maintain API compatibility)

**Done When:**
- [ ] All thread questions contain specific scenarios, code snippets, or problem details
- [ ] All posts contain actual helpful content (no generic templates)
- [ ] AI answers include real explanations and code examples
- [ ] Citations contain real excerpts (not placeholders)
- [ ] Endorsements correlate with answer quality
- [ ] View counts follow realistic patterns (age + quality)
- [ ] JSON structure unchanged (API compatibility maintained)
- [ ] No syntax errors in code examples
- [ ] Domain accuracy verified (CS, Math, Physics, Writing)
- [ ] Data validates against TypeScript interfaces

---

## Constraints

1. Frontend-only scope - mock data stays in-memory
2. No breaking changes to mock API structure
3. Maintain all existing IDs and relationships
4. Domain accuracy required (CS/Math/Physics/Writing)
5. Code examples must be syntactically correct

---

## Decisions

### 1. Content Realism Strategy (`mocks/threads.json`, `mocks/posts.json`, `mocks/ai-answers.json`)
- **Approach**: Rewrite all content with domain-specific details, code examples, and realistic scenarios
- **Rationale**: Current data is unusable for demos - all content is templated
- **Files**: `mocks/threads.json`, `mocks/posts.json`, `mocks/ai-answers.json`

### 2. AI Answer Quality Tiers
- **High (85-95)**: 3-4 paragraphs + code examples + 2 citations with excerpts
- **Medium (60-75)**: 2 paragraphs + 1 example + 1 citation
- **Low (35-45)**: 1 paragraph + assignment reference + disclaimer
- **Rationale**: Match real AI behavior and showcase confidence levels
- **Files**: `mocks/ai-answers.json`

### 3. Engagement Pattern Design
- **Views**: `baseViews × ageFactor × qualityFactor × courseSize`
- **Endorsements**: Correlate with answer completeness and accuracy
- **Instructor endorsements**: Only on fully correct, comprehensive answers
- **Rationale**: Realistic patterns demonstrate platform analytics
- **Files**: `mocks/threads.json`, `mocks/posts.json`, `mocks/ai-answers.json`

### 4. Academic Q&A Pattern Research (`research/academic-qa-patterns.md`)
- **Domains Covered**: CS 101, CS 201, MATH 221, CS 301, PHYS 201, ENG 101
- **Pattern Types**: Code debugging, conceptual confusion, edge cases, algorithm design, formula errors
- **Question Complexity**: 4 levels (conceptual, application, debugging, design/proof)
- **Key Findings**: 60-80% of technical questions should include code/formulas; questions must show partial attempts/context
- **Files**: `doccloud/tasks/mock-data-quality/research/academic-qa-patterns.md`

### 5. AI Answer Quality Standards (`research/ai-answer-standards.md`)
- **Confidence Tiers**: High (85-95, 300-500 words, 2+ citations), Medium (59-75, 200-350 words, 1+ citation), Low (35-45, 100-200 words, 1 citation)
- **Code Requirements**: High = complete runnable code; Medium = partial/pseudocode; Low = none
- **Citation Quality**: High (80-95 relevance, 60-120 words), Medium (65-80, 40-80 words), Low (50-65, 30-60 words)
- **Tone Patterns**: High = confident/authoritative; Medium = cautious with light disclaimers; Low = strong disclaimers + instructor follow-up
- **Distribution**: 33% high (10 answers), 40% medium (12 answers), 27% low (8 answers)
- **Files**: `doccloud/tasks/mock-data-quality/research/ai-answer-standards.md`

---

## Risks & Rollback

**Risks:**
- Large JSON files may have typos or syntax errors
- Domain inaccuracy in technical content (CS/Math/Physics)
- Breaking referential integrity between threads/posts/answers
- Time investment (~8-9 hours)

**Rollback:**
- Git commit before starting each file
- Keep original files as `*.json.backup`
- Validate JSON after each change
- Test API calls after completion

---

## Related Files

- `mocks/threads.json` - Thread questions (24 entries)
- `mocks/posts.json` - Student/TA replies (53 entries)
- `mocks/ai-answers.json` - AI-generated answers (30 entries)
- `mocks/courses.json` - Course metadata (reference)
- `mocks/users.json` - User profiles (reference)
- `lib/models/types.ts` - TypeScript interfaces (validation)
- `lib/api/client.ts` - Mock API implementation (testing)

---

## TODO

- [x] Create task context
- [x] Research academic Q&A patterns by domain
- [x] Define AI answer quality standards
- [x] Design engagement patterns
- [ ] Rewrite thread questions
- [ ] Rewrite post replies
- [ ] Generate AI answers
- [ ] Create citation excerpts
- [ ] Adjust engagement metrics
- [ ] Validate and test

---

## Changelog

- `2025-10-07` | [Complete] | Task completed successfully - all mock data transformed with realistic, domain-specific content
- `2025-10-07` | [Implementation] | Applied engagement metrics: views (24-70, avg 44), post endorsements (20.8%), AI instructor endorsements (4/24)
- `2025-10-07` | [Implementation] | Generated 30 realistic AI answers with complete explanations, working code examples, and meaningful citations
- `2025-10-07` | [Implementation] | Rewrote all 53 post replies with helpful content (30% endorsed, role-appropriate responses)
- `2025-10-07` | [Implementation] | Rewrote all 24 thread questions with realistic code, formulas, and specific scenarios
- `2025-10-07` | [Research] | Designed engagement patterns: view formulas, endorsement heuristics, quality correlations
- `2025-10-07` | [Research] | Defined AI answer quality standards: 3 confidence tiers with structure, code, citation, and tone requirements
- `2025-10-07` | [Research] | Completed academic Q&A pattern research for 6 domains (CS 101, CS 201, MATH 221, CS 301, PHYS 201, ENG 101)
- `2025-10-07` | [Task Setup] | Created task context and directory structure
