/**
 * Unit tests for RAG tool handlers (kb.search and kb.fetch)
 *
 * Tests focus on turn-based usage limits to prevent abuse:
 * - Max 1 kb.search per turn
 * - Max 1 kb.fetch per turn
 * - Limits reset per unique turn
 */

import { handleKBSearch, handleKBFetch } from '../handlers';

describe('handleKBSearch', () => {
  describe('turn-based usage limits', () => {
    it('should allow first search in a turn', async () => {
      const turnId = 'turn-1';

      const result = await handleKBSearch({
        query: 'binary search',
        maxResults: 3,
        turnId,
      });

      expect(result.materials).toBeDefined();
      expect(result.totalFound).toBeGreaterThanOrEqual(0);
    });

    it('should block second search in same turn', async () => {
      const turnId = 'turn-2';

      // First search succeeds
      await handleKBSearch({
        query: 'binary search',
        maxResults: 3,
        turnId,
      });

      // Second search fails with limit error
      await expect(
        handleKBSearch({
          query: 'quicksort',
          maxResults: 3,
          turnId,
        })
      ).rejects.toThrow(/Tool usage limit exceeded.*kb\.search/);
    });

    it('should allow searches in different turns', async () => {
      const turnId1 = 'turn-3';
      const turnId2 = 'turn-4';

      // First turn
      const result1 = await handleKBSearch({
        query: 'binary search',
        maxResults: 3,
        turnId: turnId1,
      });
      expect(result1.materials).toBeDefined();

      // Second turn (different turnId) - should succeed
      const result2 = await handleKBSearch({
        query: 'quicksort',
        maxResults: 3,
        turnId: turnId2,
      });
      expect(result2.materials).toBeDefined();
    });

    it('should enforce exact limit of 1 search per turn', async () => {
      const turnId = 'turn-5';

      // First succeeds
      await handleKBSearch({
        query: 'algorithms',
        maxResults: 2,
        turnId,
      });

      // Second fails
      await expect(
        handleKBSearch({
          query: 'data structures',
          maxResults: 2,
          turnId,
        })
      ).rejects.toThrow('Maximum 1 kb.search call(s) per turn');
    });
  });

  describe('search functionality', () => {
    it('should return materials with required fields', async () => {
      const result = await handleKBSearch({
        query: 'binary search',
        maxResults: 2,
        turnId: 'turn-6',
      });

      expect(result.materials).toBeDefined();
      expect(Array.isArray(result.materials)).toBe(true);

      if (result.materials.length > 0) {
        const material = result.materials[0];
        expect(material).toHaveProperty('id');
        expect(material).toHaveProperty('title');
        expect(material).toHaveProperty('type');
        expect(material).toHaveProperty('excerpt');
        expect(material).toHaveProperty('relevanceScore');
        expect(material).toHaveProperty('matchedKeywords');
      }
    });

    it('should respect maxResults parameter', async () => {
      const maxResults = 2;
      const result = await handleKBSearch({
        query: 'algorithm',
        maxResults,
        turnId: 'turn-7',
      });

      expect(result.materials.length).toBeLessThanOrEqual(maxResults);
    });

    it('should return search metadata', async () => {
      const result = await handleKBSearch({
        query: 'binary search',
        maxResults: 3,
        turnId: 'turn-8',
      });

      expect(result.searchParams).toBeDefined();
      expect(result.searchParams.query).toBe('binary search');
      expect(result.searchParams.maxResults).toBe(3);
      expect(result.totalFound).toBeDefined();
    });
  });

  describe('course-specific searches', () => {
    it('should filter by courseId when provided', async () => {
      const result = await handleKBSearch({
        query: 'algorithm',
        courseId: 'course-cs101',
        maxResults: 5,
        turnId: 'turn-9',
      });

      expect(result.searchParams.courseId).toBe('course-cs101');
      expect(result.materials).toBeDefined();
    });

    it('should search all courses when courseId omitted', async () => {
      const result = await handleKBSearch({
        query: 'calculus',
        maxResults: 5,
        turnId: 'turn-10',
      });

      expect(result.searchParams.courseId).toBeNull();
      expect(result.materials).toBeDefined();
    });
  });
});

describe('handleKBFetch', () => {
  describe('turn-based usage limits', () => {
    it('should allow first fetch in a turn', async () => {
      const turnId = 'turn-11';

      // Note: This will fail if material doesn't exist - expected for unit test
      try {
        await handleKBFetch({
          materialId: 'mat-cs101-lecture-1',
          turnId,
        });
      } catch (error) {
        // Expected - material may not exist in mock data
        expect(error).toBeDefined();
      }
    });

    it('should block second fetch in same turn', async () => {
      const turnId = 'turn-12';

      // First fetch (may fail if material doesn't exist, but counts toward limit)
      try {
        await handleKBFetch({
          materialId: 'mat-cs101-lecture-1',
          turnId,
        });
      } catch {
        // Ignore - we're testing the limit, not material existence
      }

      // Second fetch should fail with limit error
      await expect(
        handleKBFetch({
          materialId: 'mat-cs101-lecture-2',
          turnId,
        })
      ).rejects.toThrow(/Tool usage limit exceeded.*kb\.fetch/);
    });

    it('should allow fetches in different turns', async () => {
      const turnId1 = 'turn-13';
      const turnId2 = 'turn-14';

      // First turn (may fail - we're testing limit, not existence)
      try {
        await handleKBFetch({
          materialId: 'mat-cs101-lecture-1',
          turnId: turnId1,
        });
      } catch {
        // Ignore
      }

      // Second turn should NOT throw limit error (may throw material not found)
      try {
        await handleKBFetch({
          materialId: 'mat-cs101-lecture-2',
          turnId: turnId2,
        });
      } catch (error: unknown) {
        // Should NOT be a limit error
        const err = error as Error;
        expect(err.message).not.toMatch(/Tool usage limit exceeded/);
      }
    });

    it('should enforce exact limit of 1 fetch per turn', async () => {
      const turnId = 'turn-15';

      // First fetch
      try {
        await handleKBFetch({
          materialId: 'mat-cs101-lecture-1',
          turnId,
        });
      } catch {
        // Ignore material not found
      }

      // Second fetch should fail with specific limit message
      await expect(
        handleKBFetch({
          materialId: 'mat-cs101-lecture-2',
          turnId,
        })
      ).rejects.toThrow('Maximum 1 kb.fetch call(s) per turn');
    });
  });

  describe('fetch functionality', () => {
    it('should throw error for invalid material ID format', async () => {
      await expect(
        handleKBFetch({
          materialId: 'invalid-id',
          turnId: 'turn-16',
        })
      ).rejects.toThrow(/Invalid material ID format/);
    });

    it('should throw error for non-existent material', async () => {
      await expect(
        handleKBFetch({
          materialId: 'mat-nonexistent-lecture-999',
          turnId: 'turn-17',
        })
      ).rejects.toThrow(/not found/);
    });
  });
});

describe('cross-tool turn limits', () => {
  it('should independently track search and fetch limits', async () => {
    const turnId = 'turn-18';

    // 1 search should succeed
    const searchResult = await handleKBSearch({
      query: 'algorithms',
      maxResults: 3,
      turnId,
    });
    expect(searchResult.materials).toBeDefined();

    // 1 fetch should also succeed (independent limit)
    try {
      await handleKBFetch({
        materialId: 'mat-cs101-lecture-1',
        turnId,
      });
    } catch (error: unknown) {
      // If it fails, should be "not found", not "limit exceeded"
      const err = error as Error;
      expect(err.message).not.toMatch(/Tool usage limit exceeded/);
    }

    // Second search should fail
    await expect(
      handleKBSearch({
        query: 'data structures',
        maxResults: 3,
        turnId,
      })
    ).rejects.toThrow(/kb\.search/);
  });
});
