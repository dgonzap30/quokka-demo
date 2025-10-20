/**
 * Courses Routes
 *
 * Course endpoints (list, get)
 */

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "../../plugins/validation.plugin.js";
import {
  courseSchema,
  listCoursesResponseSchema,
  getCourseParamsSchema,
} from "../../schemas/courses.schema.js";
import {
  getEnrollmentsQuerySchema,
  listEnrollmentsResponseSchema,
} from "../../schemas/enrollments.schema.js";
import { coursesRepository } from "../../repositories/courses.repository.js";
import { enrollmentsRepository } from "../../repositories/enrollments.repository.js";
import { usersRepository } from "../../repositories/users.repository.js";
import { NotFoundError } from "../../utils/errors.js";

export async function coursesRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /api/v1/courses
   * List all active courses
   */
  server.get(
    "/courses",
    {
      schema: {
        response: {
          200: listCoursesResponseSchema,
        },
        tags: ["courses"],
        description: "List all active courses",
      },
    },
    async (request, reply) => {
      const courses = await coursesRepository.findAll(false); // Active only

      return {
        items: courses,
      };
    }
  );

  /**
   * GET /api/v1/courses/:id
   * Get single course by ID
   */
  server.get(
    "/courses/:id",
    {
      schema: {
        params: getCourseParamsSchema,
        response: {
          200: courseSchema,
        },
        tags: ["courses"],
        description: "Get course by ID",
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const course = await coursesRepository.findById(id);

      if (!course) {
        throw new NotFoundError("Course");
      }

      return course;
    }
  );

  /**
   * GET /api/v1/courses/enrollments
   * Get enrollments for a user (with course details)
   */
  server.get(
    "/courses/enrollments",
    {
      schema: {
        querystring: getEnrollmentsQuerySchema,
        response: {
          200: listEnrollmentsResponseSchema,
        },
        tags: ["courses"],
        description: "Get user enrollments with course details",
      },
    },
    async (request, reply) => {
      const { userId } = request.query;

      // Verify user exists
      const user = await usersRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User");
      }

      // Get enrollments with course details
      const enrollments = await enrollmentsRepository.findByUserId(userId);

      return {
        items: enrollments,
      };
    }
  );
}
