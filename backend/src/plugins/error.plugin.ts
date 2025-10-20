/**
 * Error Handler Plugin
 *
 * Catches all errors and returns standardized error responses
 */

import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { APIError } from "../utils/errors.js";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

async function errorPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    async (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      // Generate request ID for tracking (in production, use proper request ID middleware)
      const requestId = request.id || crypto.randomUUID();

      // Handle APIError (our custom errors)
      if (error instanceof APIError) {
        const response: ErrorResponse = {
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
        };

        if (error.details) {
          response.error.details = error.details;
        }

        request.log.warn(
          {
            err: error,
            requestId,
            statusCode: error.statusCode,
          },
          `API Error: ${error.message}`
        );

        return reply.code(error.statusCode).send(response);
      }

      // Handle Fastify validation errors (from Zod)
      if ("validation" in error && error.validation) {
        const response: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: error.message || "Validation failed",
            details: error.validation,
            requestId,
          },
        };

        request.log.warn(
          {
            err: error,
            requestId,
            validation: error.validation,
          },
          "Validation error"
        );

        return reply.code(400).send(response);
      }

      // Handle other Fastify errors
      if ("statusCode" in error && error.statusCode) {
        const response: ErrorResponse = {
          error: {
            code: error.code || "ERROR",
            message: error.message,
            requestId,
          },
        };

        request.log.error(
          {
            err: error,
            requestId,
            statusCode: error.statusCode,
          },
          `Fastify error: ${error.message}`
        );

        return reply.code(error.statusCode).send(response);
      }

      // Handle unknown errors (5xx)
      const response: ErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production"
              ? "Internal server error"
              : error.message,
          requestId,
        },
      };

      request.log.error(
        {
          err: error,
          requestId,
        },
        `Unhandled error: ${error.message}`
      );

      return reply.code(500).send(response);
    }
  );
}

export default fp(errorPlugin, {
  name: "error-plugin",
});
