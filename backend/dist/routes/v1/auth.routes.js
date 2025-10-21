import { devLoginSchema, authResponseSchema, currentUserSchema, logoutResponseSchema } from "../../schemas/auth.schema.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { UnauthorizedError, NotFoundError, serializeDate } from "../../utils/errors.js";
export async function authRoutes(fastify) {
    const server = fastify.withTypeProvider();
    server.post("/dev-login", {
        schema: {
            body: devLoginSchema,
            response: {
                200: authResponseSchema,
            },
            tags: ["auth"],
            description: "Dev login (email only, no password)",
        },
    }, async (request, reply) => {
        const { email } = request.body;
        const user = await usersRepository.findByEmail(email);
        if (!user) {
            throw new NotFoundError("User with this email");
        }
        const sessionData = {
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            createdAt: new Date().toISOString(),
        };
        await fastify.setSession(reply, sessionData);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
            message: "Logged in successfully",
        };
    });
    server.get("/me", {
        schema: {
            response: {
                200: currentUserSchema,
            },
            tags: ["auth"],
            description: "Get current user",
        },
    }, async (request, reply) => {
        if (!request.session) {
            throw new UnauthorizedError("Not authenticated");
        }
        const user = await usersRepository.findById(request.session.userId);
        if (!user) {
            throw new UnauthorizedError("Session user not found");
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            createdAt: serializeDate(user.createdAt),
        };
    });
    server.post("/logout", {
        schema: {
            response: {
                200: logoutResponseSchema,
            },
            tags: ["auth"],
            description: "Logout current user",
        },
    }, async (request, reply) => {
        fastify.clearSession(reply);
        return {
            message: "Logged out successfully",
        };
    });
}
//# sourceMappingURL=auth.routes.js.map