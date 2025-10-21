import fastifyCookie from "@fastify/cookie";
import fp from "fastify-plugin";
import { generateTokenPair, verifyToken, refreshAccessToken } from "../auth/jwt.utils.js";
const ACCESS_TOKEN_COOKIE = "quokka.token";
const REFRESH_TOKEN_COOKIE = "quokka.refresh";
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
async function sessionPlugin(fastify) {
    await fastify.register(fastifyCookie, {
        hook: "onRequest",
    });
    fastify.decorateRequest("session", null);
    fastify.addHook("onRequest", async (request, reply) => {
        const accessToken = request.cookies[ACCESS_TOKEN_COOKIE];
        const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE];
        if (accessToken) {
            try {
                const payload = await verifyToken(accessToken, "access");
                request.session = {
                    userId: payload.userId,
                    email: payload.email,
                    role: payload.role,
                    tenantId: payload.tenantId,
                };
            }
            catch (error) {
                if (error.message === "Token has expired" && refreshToken) {
                    try {
                        const newAccessToken = await refreshAccessToken(refreshToken);
                        const payload = await verifyToken(newAccessToken, "access");
                        reply.setCookie(ACCESS_TOKEN_COOKIE, newAccessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === "production",
                            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
                            maxAge: ACCESS_TOKEN_MAX_AGE,
                            path: "/",
                        });
                        request.session = {
                            userId: payload.userId,
                            email: payload.email,
                            role: payload.role,
                            tenantId: payload.tenantId,
                        };
                        request.log.info("Access token refreshed successfully");
                    }
                    catch (refreshError) {
                        request.log.warn("Refresh token is invalid, clearing session");
                        reply.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
                        reply.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
                    }
                }
                else {
                    request.log.warn({ error: error.message }, "Invalid access token");
                }
            }
        }
    });
    fastify.decorate("setSession", async function (reply, sessionData) {
        try {
            const { accessToken, refreshToken } = await generateTokenPair({
                userId: sessionData.userId,
                email: sessionData.email,
                role: sessionData.role,
                tenantId: sessionData.tenantId,
            });
            reply.setCookie(ACCESS_TOKEN_COOKIE, accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
                maxAge: ACCESS_TOKEN_MAX_AGE,
                path: "/",
            });
            reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
                maxAge: REFRESH_TOKEN_MAX_AGE,
                path: "/",
            });
        }
        catch (error) {
            fastify.log.error({ error }, "Failed to generate session tokens");
            throw error;
        }
    });
    fastify.decorate("clearSession", function (reply) {
        reply.clearCookie(ACCESS_TOKEN_COOKIE, {
            path: "/",
        });
        reply.clearCookie(REFRESH_TOKEN_COOKIE, {
            path: "/",
        });
    });
}
export default fp(sessionPlugin, {
    name: "session-plugin",
});
//# sourceMappingURL=session.plugin.js.map