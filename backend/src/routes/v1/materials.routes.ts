/**
 * Course Materials Routes
 *
 * Material endpoints (list, search)
 */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "../../plugins/validation.plugin.js";
import { z } from "zod";
import {
  courseMaterialSchema,
  courseMaterialSearchResultSchema,
  getMaterialsQuerySchema,
  searchMaterialsBodySchema,
  listMaterialsResponseSchema,
  searchMaterialsResponseSchema,
  getCourseIdParamsSchema,
} from "../../schemas/materials.schema.js";
import { courseMaterialsRepository } from "../../repositories/materials.repository.js";
import { coursesRepository } from "../../repositories/courses.repository.js";
import { NotFoundError } from "../../utils/errors.js";

export async function materialsRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /api/v1/materials?courseId=<id>
   * List all materials for a course (query param version)
   */
  server.get(
    "/materials",
    {
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
    },
    async (request, reply) => {
      const { courseId, type } = request.query;

      // Verify course exists
      const course = await coursesRepository.findById(courseId);
      if (!course) {
        throw new NotFoundError("Course");
      }

      // Get materials
      const materials = type
        ? await courseMaterialsRepository.findByType(courseId, [type])
        : await courseMaterialsRepository.findByCourse(courseId);

      // Sort by type order, then title
      const typeOrder = ["lecture", "slide", "assignment", "reading", "lab", "textbook"];
      const sorted = materials.sort((a, b) => {
        const typeComparison =
          typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        if (typeComparison !== 0) return typeComparison;
        return a.title.localeCompare(b.title);
      });

      return {
        items: sorted as any,
      };
    }
  );

  /**
   * GET /api/v1/materials/:id
   * Get single material by ID
   */
  server.get(
    "/materials/:id",
    {
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
    },
    async (request, reply) => {
      const { id } = request.params;

      const material = await courseMaterialsRepository.findById(id);
      if (!material) {
        throw new NotFoundError("Material");
      }

      return material as any;
    }
  );

  /**
   * GET /api/v1/courses/:courseId/materials
   * List all materials for a course (legacy path param version)
   */
  server.get(
    "/courses/:courseId/materials",
    {
      schema: {
        params: getCourseIdParamsSchema,
        querystring: getMaterialsQuerySchema,
        response: {
          200: listMaterialsResponseSchema,
        },
        tags: ["materials"],
        description: "List all materials for a course",
      },
    },
    async (request, reply) => {
      const { courseId } = request.params;
      const { type } = request.query;

      // Verify course exists
      const course = await coursesRepository.findById(courseId);
      if (!course) {
        throw new NotFoundError("Course");
      }

      // Get materials
      const materials = type
        ? await courseMaterialsRepository.findByType(courseId, [type])
        : await courseMaterialsRepository.findByCourse(courseId);

      // Sort by type order, then title
      const typeOrder = ["lecture", "slide", "assignment", "reading", "lab", "textbook"];
      const sorted = materials.sort((a, b) => {
        const typeComparison =
          typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        if (typeComparison !== 0) return typeComparison;
        return a.title.localeCompare(b.title);
      });

      return {
        items: sorted as any,
      };
    }
  );

  /**
   * POST /api/v1/courses/:courseId/materials/search
   * Search course materials by keywords
   */
  server.post(
    "/courses/:courseId/materials/search",
    {
      schema: {
        params: getCourseIdParamsSchema,
        body: searchMaterialsBodySchema,
        response: {
          200: searchMaterialsResponseSchema,
        },
        tags: ["materials"],
        description: "Search course materials by keywords",
      },
    },
    async (request, reply) => {
      const { courseId } = request.params;
      const { query, types, limit, minRelevance } = request.body;

      // Verify course exists
      const course = await coursesRepository.findById(courseId);
      if (!course) {
        throw new NotFoundError("Course");
      }

      // Search materials
      const results = await courseMaterialsRepository.searchMaterials(
        courseId,
        query,
        types,
        limit,
        minRelevance
      );

      return {
        results: results as any,
      };
    }
  );
}
