import type { FastifyInstance } from "fastify";
export interface SessionData {
    userId: string;
    email: string;
    role: string;
    tenantId: string;
    createdAt?: string;
}
declare module "fastify" {
    interface FastifyRequest {
        session?: SessionData;
    }
}
declare function sessionPlugin(fastify: FastifyInstance): Promise<void>;
declare const _default: typeof sessionPlugin;
export default _default;
declare module "fastify" {
    interface FastifyInstance {
        setSession(reply: FastifyReply, sessionData: SessionData): void;
        clearSession(reply: FastifyReply): void;
    }
}
//# sourceMappingURL=session.plugin.d.ts.map