import { z } from "zod";
import { courseMaterialSchema, getMaterialsQuerySchema, searchMaterialsBodySchema, listMaterialsResponseSchema, searchMaterialsResponseSchema, getCourseIdParamsSchema, } from "../../schemas/materials.schema.js";
import { courseMaterialsRepository } from "../../repositories/materials.repository.js";
import { coursesRepository } from "../../repositories/courses.repository.js";
import { NotFoundError } from "../../utils/errors.js";
export async function materialsRoutes(fastify) {
    const server = fastify.withTypeProvider();
    server.get("/materials", {
        schema: {
            querystring: getMaterialsQuerySchema.extend({
                courseId: z.string(),
            }),
            response: {
                200: listMaterialsResponseSchema,
            },
            tags: ["materials"],
            description: "List all materials for a course",
        },
    }, async (request, reply) => {
        const { courseId, type } = request.query;
        const course = await coursesRepository.findById(courseId);
        if (!course) {
            throw new NotFoundError("Course");
        }
        const materials = type
            ? await courseMaterialsRepository.findByType(courseId, [type])
            : await courseMaterialsRepository.findByCourse(courseId);
        const typeOrder = ["lecture", "slide", "assignment", "reading", "lab", "textbook"];
        const sorted = materials.sort((a, b) => {
            const typeComparison = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
            if (typeComparison !== 0)
                return typeComparison;
            return a.title.localeCompare(b.title);
        });
        return {
            items: sorted,
        };
    });
    server.get("/materials/:id", {
        schema: {
            params: z.object({
                id: z.string(),
            }),
            response: {
                200: courseMaterialSchema,
            },
            tags: ["materials"],
            description: "Get single material by ID",
        },
    }, async (request, reply) => {
        const { id } = request.params;
        const material = await courseMaterialsRepository.findById(id);
        if (!material) {
            throw new NotFoundError("Material");
        }
        return material;
    });
    server.get("/courses/:courseId/materials", {
        schema: {
            params: getCourseIdParamsSchema,
            querystring: getMaterialsQuerySchema,
            response: {
                200: listMaterialsResponseSchema,
            },
            tags: ["materials"],
            description: "List all materials for a course",
        },
    }, async (request, reply) => {
        const { courseId } = request.params;
        const { type } = request.query;
        const course = await coursesRepository.findById(courseId);
        if (!course) {
            throw new NotFoundError("Course");
        }
        const materials = type
            ? await courseMaterialsRepository.findByType(courseId, [type])
            : await courseMaterialsRepository.findByCourse(courseId);
        const typeOrder = ["lecture", "slide", "assignment", "reading", "lab", "textbook"];
        const sorted = materials.sort((a, b) => {
            const typeComparison = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
            if (typeComparison !== 0)
                return typeComparison;
            return a.title.localeCompare(b.title);
        });
        return {
            items: sorted,
        };
    });
    server.post("/courses/:courseId/materials/search", {
        schema: {
            params: getCourseIdParamsSchema,
            body: searchMaterialsBodySchema,
            response: {
                200: searchMaterialsResponseSchema,
            },
            tags: ["materials"],
            description: "Search course materials by keywords",
        },
    }, async (request, reply) => {
        const { courseId } = request.params;
        const { query, types, limit, minRelevance } = request.body;
        const course = await coursesRepository.findById(courseId);
        if (!course) {
            throw new NotFoundError("Course");
        }
        const results = await courseMaterialsRepository.searchMaterials(courseId, query, types, limit, minRelevance);
        return {
            results: results,
        };
    });
}
//# sourceMappingURL=materials.routes.js.map