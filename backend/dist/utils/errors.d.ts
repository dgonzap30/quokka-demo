export declare enum ErrorCode {
    BAD_REQUEST = "BAD_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR"
}
export declare class APIError extends Error {
    code: ErrorCode;
    statusCode: number;
    details?: any | undefined;
    constructor(code: ErrorCode, statusCode: number, message: string, details?: any | undefined);
}
export declare class BadRequestError extends APIError {
    constructor(message: string, details?: any);
}
export declare class UnauthorizedError extends APIError {
    constructor(message?: string);
}
export declare class ForbiddenError extends APIError {
    constructor(message?: string);
}
export declare class NotFoundError extends APIError {
    constructor(resource: string);
}
export declare class ConflictError extends APIError {
    constructor(message: string);
}
export declare class ValidationError extends APIError {
    constructor(message: string, details?: any);
}
export declare class InternalError extends APIError {
    constructor(message?: string);
}
export declare class DatabaseError extends APIError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map