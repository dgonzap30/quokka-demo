import type { FastifyInstance } from 'fastify';

/**
 * Health check routes for monitoring and deployment
 *
 * Endpoints:
 * - GET /health - Basic health check (always returns 200 OK if server is running)
 * - GET /ready - Readiness check (includes database connectivity test)
 * - GET /ping - Simple ping endpoint
 */
export default async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check - returns OK if server is running
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  // Readiness check - includes database connectivity test
  fastify.get('/ready', async () => {
    try {
      // Test database connection by querying users table
      const testQuery = await fastify.db.query.users.findFirst();

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: testQuery ? 'connected' : 'empty',
        uptime: process.uptime()
      };
    } catch (error) {
      // Database not ready
      fastify.log.error('Database readiness check failed:', error);
      throw fastify.httpErrors.serviceUnavailable('Database not ready');
    }
  });

  // Simple ping endpoint for basic connectivity tests
  fastify.get('/ping', async () => {
    return { pong: true };
  });
}
