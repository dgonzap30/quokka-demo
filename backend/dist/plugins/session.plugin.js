import fastifyCookie from "@fastify/cookie";
import fp from "fastify-plugin";
const SESSION_COOKIE_NAME = "quokka.session";
const SESSION_SECRET = process.env.SESSION_SECRET || "demo-secret-change-in-production";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
async function sessionPlugin(fastify) {
    await fastify.register(fastifyCookie, {
        secret: SESSION_SECRET,
        hook: "onRequest",
    });
    fastify.decorateRequest("session", null);
    fastify.addHook("onRequest", async (request, _reply) => {
        const sessionCookie = request.cookies[SESSION_COOKIE_NAME];
        if (sessionCookie) {
            try {
                const unsignedValue = request.unsignCookie(sessionCookie);
                if (unsignedValue.valid && unsignedValue.value) {
                    const sessionData = JSON.parse(unsignedValue.value);
                    request.session = sessionData;
                }
            }
            catch (error) {
                request.log.warn("Invalid session cookie, ignoring");
            }
        }
    });
    fastify.decorate("setSession", function (reply, sessionData) {
        const cookieValue = JSON.stringify(sessionData);
        reply.setCookie(SESSION_COOKIE_NAME, cookieValue, {
            signed: true,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_MAX_AGE,
            path: "/",
        });
    });
    fastify.decorate("clearSession", function (reply) {
        reply.clearCookie(SESSION_COOKIE_NAME, {
            path: "/",
        });
    });
}
export default fp(sessionPlugin, {
    name: "session-plugin",
});
//# sourceMappingURL=session.plugin.js.map