/**
 * Unit tests for rate limiting utility
 */

import { rateLimit, cleanupExpiredEntries, clearStore } from '../rate-limit';

// Helper to sleep for testing timing
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('rateLimit', () => {
  beforeEach(() => {
    // Clear store before each test
    clearStore();
  });

  describe('basic rate limiting', () => {
    it('should allow requests within limit', async () => {
      const limiter = rateLimit({ requests: 2, window: '1m' });

      const result1 = await limiter.check('user1');
      expect(result1.allowed).toBe(true);
      expect(result1.count).toBe(1);
      expect(result1.limit).toBe(2);

      const result2 = await limiter.check('user1');
      expect(result2.allowed).toBe(true);
      expect(result2.count).toBe(2);
      expect(result2.limit).toBe(2);
    });

    it('should block requests over limit', async () => {
      const limiter = rateLimit({ requests: 1, window: '1m' });

      // First request succeeds
      const result1 = await limiter.check('user1');
      expect(result1.allowed).toBe(true);

      // Second request fails
      const result2 = await limiter.check('user1');
      expect(result2.allowed).toBe(false);
      expect(result2.retryAfter).toBeGreaterThan(0);
      expect(result2.retryAfter).toBeLessThanOrEqual(60);
    });

    it('should track different users separately', async () => {
      const limiter = rateLimit({ requests: 1, window: '1m' });

      const result1 = await limiter.check('user1');
      expect(result1.allowed).toBe(true);

      const result2 = await limiter.check('user2');
      expect(result2.allowed).toBe(true);

      // Both users hit limit independently
      const result3 = await limiter.check('user1');
      expect(result3.allowed).toBe(false);

      const result4 = await limiter.check('user2');
      expect(result4.allowed).toBe(false);
    });
  });

  describe('window expiry', () => {
    it('should reset count after window expires', async () => {
      const limiter = rateLimit({ requests: 1, window: '1s' });

      // First request succeeds
      const result1 = await limiter.check('user1');
      expect(result1.allowed).toBe(true);

      // Second request immediately fails
      const result2 = await limiter.check('user1');
      expect(result2.allowed).toBe(false);

      // Wait for window to expire
      await sleep(1100);

      // Third request succeeds (new window)
      const result3 = await limiter.check('user1');
      expect(result3.allowed).toBe(true);
      expect(result3.count).toBe(1);
    });
  });

  describe('window parsing', () => {
    it('should parse seconds correctly', async () => {
      const limiter = rateLimit({ requests: 1, window: '10s' });
      await limiter.check('user1');
      const result = await limiter.check('user1');

      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(10);
    });

    it('should parse minutes correctly', async () => {
      const limiter = rateLimit({ requests: 1, window: '5m' });
      await limiter.check('user1');
      const result = await limiter.check('user1');

      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(300);
    });

    it('should parse hours correctly', async () => {
      const limiter = rateLimit({ requests: 1, window: '1h' });
      await limiter.check('user1');
      const result = await limiter.check('user1');

      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(3600);
    });

    it('should throw on invalid window format', () => {
      expect(() => {
        rateLimit({ requests: 10, window: 'invalid' });
      }).toThrow('Invalid window format');
    });
  });

  describe('reset functionality', () => {
    it('should reset rate limit for specific user', async () => {
      const limiter = rateLimit({ requests: 1, window: '1m' });

      // Hit limit
      await limiter.check('user1');
      const blocked = await limiter.check('user1');
      expect(blocked.allowed).toBe(false);

      // Reset
      limiter.reset('user1');

      // Should work again
      const result = await limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.count).toBe(1);
    });

    it('should not affect other users when resetting', async () => {
      const limiter = rateLimit({ requests: 1, window: '1m' });

      await limiter.check('user1');
      await limiter.check('user2');

      limiter.reset('user1');

      // user1 reset
      const result1 = await limiter.check('user1');
      expect(result1.allowed).toBe(true);

      // user2 still at limit
      const result2 = await limiter.check('user2');
      expect(result2.allowed).toBe(false);
    });
  });

  describe('status functionality', () => {
    it('should return current status for user', async () => {
      const limiter = rateLimit({ requests: 5, window: '1m' });

      await limiter.check('user1');
      await limiter.check('user1');

      const status = limiter.status('user1');
      expect(status).not.toBeNull();
      expect(status?.count).toBe(2);
      expect(status?.resetAt).toBeGreaterThan(Date.now());
    });

    it('should return null for non-existent user', () => {
      const limiter = rateLimit({ requests: 5, window: '1m' });
      const status = limiter.status('nonexistent');
      expect(status).toBeNull();
    });

    it('should return null for expired entry', async () => {
      const limiter = rateLimit({ requests: 1, window: '1s' });

      await limiter.check('user1');

      // Wait for expiry
      await sleep(1100);

      const status = limiter.status('user1');
      expect(status).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const limiter1 = rateLimit({ requests: 1, window: '1s' });
      const limiter2 = rateLimit({ requests: 1, window: '1m' });

      await limiter1.check('user1');
      await limiter2.check('user2');

      // Wait for user1's entry to expire
      await sleep(1100);

      cleanupExpiredEntries();

      // user1 entry cleaned (expired)
      const status1 = limiter1.status('user1');
      expect(status1).toBeNull();

      // user2 entry still exists (not expired)
      const status2 = limiter2.status('user2');
      expect(status2).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle 0 request limit correctly', async () => {
      const limiter = rateLimit({ requests: 0, window: '1m' });
      const result = await limiter.check('user1');
      expect(result.allowed).toBe(false);
    });

    it('should handle very high request limits', async () => {
      const limiter = rateLimit({ requests: 1000, window: '1m' });

      for (let i = 0; i < 100; i++) {
        const result = await limiter.check('user1');
        expect(result.allowed).toBe(true);
      }
    });

    it('should handle rapid concurrent requests', async () => {
      const limiter = rateLimit({ requests: 5, window: '1m' });

      const promises = Array.from({ length: 10 }, () =>
        limiter.check('user1')
      );

      const results = await Promise.all(promises);

      const allowed = results.filter(r => r.allowed).length;
      const blocked = results.filter(r => !r.allowed).length;

      expect(allowed).toBe(5);
      expect(blocked).toBe(5);
    });
  });

  describe('retry-after calculation', () => {
    it('should provide accurate retry-after timing', async () => {
      const limiter = rateLimit({ requests: 1, window: '10s' });

      await limiter.check('user1');
      const result = await limiter.check('user1');

      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(10);

      // Wait a bit
      await sleep(2000);

      // Check again - retry-after should be less
      const result2 = await limiter.check('user1');
      expect(result2.retryAfter!).toBeLessThan(result.retryAfter!);
    });
  });
});
