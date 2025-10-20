export var ErrorCode;
(function (ErrorCode) {
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
})(ErrorCode || (ErrorCode = {}));
export class APIError extends Error {
    code;
    statusCode;
    details;
    constructor(code, statusCode, message, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = "APIError";
    }
}
export class BadRequestError extends APIError {
    constructor(message, details) {
        super(ErrorCode.BAD_REQUEST, 400, message, details);
        this.name = "BadRequestError";
    }
}
export class UnauthorizedError extends APIError {
    constructor(message = "Unauthorized") {
        super(ErrorCode.UNAUTHORIZED, 401, message);
        this.name = "UnauthorizedError";
    }
}
export class ForbiddenError extends APIError {
    constructor(message = "Forbidden") {
        super(ErrorCode.FORBIDDEN, 403, message);
        this.name = "ForbiddenError";
    }
}
export class NotFoundError extends APIError {
    constructor(resource) {
        super(ErrorCode.NOT_FOUND, 404, `${resource} not found`);
        this.name = "NotFoundError";
    }
}
export class ConflictError extends APIError {
    constructor(message) {
        super(ErrorCode.CONFLICT, 409, message);
        this.name = "ConflictError";
    }
}
export class ValidationError extends APIError {
    constructor(message, details) {
        super(ErrorCode.VALIDATION_ERROR, 422, message, details);
        this.name = "ValidationError";
    }
}
export class InternalError extends APIError {
    constructor(message = "Internal server error") {
        super(ErrorCode.INTERNAL_ERROR, 500, message);
        this.name = "InternalError";
    }
}
export class DatabaseError extends APIError {
    constructor(message) {
        super(ErrorCode.DATABASE_ERROR, 500, message);
        this.name = "DatabaseError";
    }
}
//# sourceMappingURL=errors.js.map