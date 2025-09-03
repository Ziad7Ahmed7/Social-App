"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandling = exports.UnauthorizedException = exports.ForbiddenException = exports.ConflictException = exports.notFoundException = exports.badRequestException = exports.ApplicationException = void 0;
class ApplicationException extends Error {
    statusCode;
    constructor(message, statusCode, cause) {
        super(message, { cause });
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationException = ApplicationException;
class badRequestException extends ApplicationException {
    constructor(message, cause) {
        super(message, 400, { cause });
    }
}
exports.badRequestException = badRequestException;
class notFoundException extends ApplicationException {
    constructor(message, cause) {
        super(message, 404, { cause });
    }
}
exports.notFoundException = notFoundException;
class ConflictException extends ApplicationException {
    constructor(message, cause) {
        super(message, 409, { cause });
    }
}
exports.ConflictException = ConflictException;
class ForbiddenException extends ApplicationException {
    constructor(message, cause) {
        super(message, 403, { cause });
    }
}
exports.ForbiddenException = ForbiddenException;
class UnauthorizedException extends ApplicationException {
    constructor(message, cause) {
        super(message, 401, { cause });
    }
}
exports.UnauthorizedException = UnauthorizedException;
const globalErrorHandling = (error, req, res, next) => {
    return res.status(error.statusCode || 500).json({
        err_message: error.message || "server error",
        stack: process.env.MODE === "development" ? error.stack : undefined,
        cause: error.cause,
        error
    });
};
exports.globalErrorHandling = globalErrorHandling;
