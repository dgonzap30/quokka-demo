import fp from "fastify-plugin";
import { APIError } from "../utils/errors.js";
async function errorPlugin(fastify) {
    fastify.setErrorHandler(async (error, request, reply) => {
        const requestId = request.id || crypto.randomUUID();
        if (error instanceof APIError) {
            const response = {
                error: {
                    code: error.code,
                    message: error.message,
                    requestId,
                },
            };
            if (error.details) {
                response.error.details = error.details;
            }
            request.log.warn({
                err: error,
                requestId,
                statusCode: error.statusCode,
            }, `API Error: ${error.message}`);
            return reply.code(error.statusCode).send(response);
        }
        if ("validation" in error && error.validation) {
            const response = {
                error: {
                    code: "VALIDATION_ERROR",
                    message: error.message || "Validation failed",
                    details: error.validation,
                    requestId,
                },
            };
            request.log.warn({
                err: error,
                requestId,
                validation: error.validation,
            }, "Validation error");
            return reply.code(400).send(response);
        }
        if ("statusCode" in error && error.statusCode) {
            const response = {
                error: {
                    code: error.code || "ERROR",
                    message: error.message,
                    requestId,
                },
            };
            request.log.error({
                err: error,
                requestId,
                statusCode: error.statusCode,
            }, `Fastify error: ${error.message}`);
            return reply.code(error.statusCode).send(response);
        }
        const response = {
            error: {
                code: "INTERNAL_ERROR",
                message: process.env.NODE_ENV === "production"
                    ? "Internal server error"
                    : error.message,
                requestId,
            },
        };
        request.log.error({
            err: error,
            requestId,
        }, `Unhandled error: ${error.message}`);
        return reply.code(500).send(response);
    });
}
export default fp(errorPlugin, {
    name: "error-plugin",
});
//# sourceMappingURL=error.plugin.js.map