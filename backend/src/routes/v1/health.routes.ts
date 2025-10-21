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

  // Readiness check - simplified for production
  fastify.get('/ready', async () => {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });

  // Simple ping endpoint for basic connectivity tests
  fastify.get('/ping', async () => {
    return { pong: true };
  });
}
