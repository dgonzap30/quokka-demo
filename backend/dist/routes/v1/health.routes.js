export default async function healthRoutes(fastify) {
    fastify.get('/health', async () => {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    });
    fastify.get('/ready', async () => {
        return {
            status: 'ready',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };
    });
    fastify.get('/ping', async () => {
        return { pong: true };
    });
}
//# sourceMappingURL=health.routes.js.map