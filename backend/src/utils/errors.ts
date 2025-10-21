/**
 * Error Classes and Codes
 *
 * Standardized error handling with stable error codes
 */

export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

/**
 * Base API Error
 */
export class APIError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends APIError {
  constructor(message: string, details?: any) {
    super(ErrorCode.BAD_REQUEST, 400, message, details);
    this.name = "BadRequestError";
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends APIError {
  constructor(message: string = "Unauthorized") {
    super(ErrorCode.UNAUTHORIZED, 401, message);
    this.name = "UnauthorizedError";
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends APIError {
  constructor(message: string = "Forbidden") {
    super(ErrorCode.FORBIDDEN, 403, message);
    this.name = "ForbiddenError";
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(ErrorCode.NOT_FOUND, 404, `${resource} not found`);
    this.name = "NotFoundError";
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends APIError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, 409, message);
    this.name = "ConflictError";
  }
}

/**
 * 422 Validation Error
 */
export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(ErrorCode.VALIDATION_ERROR, 422, message, details);
    this.name = "ValidationError";
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalError extends APIError {
  constructor(message: string = "Internal server error") {
    super(ErrorCode.INTERNAL_ERROR, 500, message);
    this.name = "InternalError";
  }
}

/**
 * 500 Database Error
 */
export class DatabaseError extends APIError {
  constructor(message: string) {
    super(ErrorCode.DATABASE_ERROR, 500, message);
    this.name = "DatabaseError";
  }
}

/**
 * Serialize Date objects to ISO strings for API responses
 * Postgres returns Date objects but Zod schemas expect strings
 */
export function serializeDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === "string") return date;
  return date.toISOString();
}

/**
 * Serialize an object's Date fields to ISO strings
 * Recursively handles nested objects and arrays
 */
export function serializeDates<T extends Record<string, any>>(obj: T): any {
  const result: any = { ...obj };

  for (const key in result) {
    const value = result[key];

    if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[key] = value.map((item: any) =>
        typeof item === "object" && item !== null && item instanceof Date
          ? item.toISOString()
          : typeof item === "object" && item !== null
          ? serializeDates(item)
          : item
      );
    } else if (value && typeof value === "object") {
      result[key] = serializeDates(value);
    }
  }

  return result;
}
