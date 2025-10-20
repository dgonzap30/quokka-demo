import fp from "fastify-plugin";
import { serializerCompiler, validatorCompiler, } from "fastify-type-provider-zod";
async function validationPlugin(fastify) {
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);
}
export default fp(validationPlugin, {
    name: "validation-plugin",
});
//# sourceMappingURL=validation.plugin.js.map