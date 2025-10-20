/**
 * Validation Plugin
 *
 * Enables Zod schema validation for Fastify routes
 * Uses fastify-type-provider-zod for type-safe validation
 */

import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

async function validationPlugin(fastify: FastifyInstance) {
  // Set Zod as the validator and serializer
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
}

export default fp(validationPlugin, {
  name: "validation-plugin",
});

// Re-export ZodTypeProvider for route typing
export type { ZodTypeProvider };
