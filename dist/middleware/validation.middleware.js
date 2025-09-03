"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalFeilds = exports.validateRequest = void 0;
const error_response_1 = require("../utils/responses/error.response");
const zod_1 = require("zod");
const validateRequest = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            const zodSchema = schema[key];
            if (!zodSchema)
                continue;
            const parseResult = zodSchema.safeParse(req[key]);
            if (!parseResult.success) {
                const errors = parseResult.error;
                validationErrors.push({
                    key,
                    issues: errors.issues.map((issue) => ({
                        message: issue.message,
                        path: issue.path[0],
                    })),
                });
            }
        }
        if (validationErrors.length) {
            throw new error_response_1.badRequestException("Validation failed", { validationErrors });
        }
        return next();
    };
};
exports.validateRequest = validateRequest;
exports.generalFeilds = {
    fullName: zod_1.z.string().min(3, "Full name must be at least 3 characters long"),
    password: zod_1.z
        .string()
        .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, "Password must be at least 8 characters long and contain at least one letter and one number"),
    email: zod_1.z.email("Invalid email address"),
    otp: zod_1.z.string().regex(/^\d{6}$/, "OTP must be a 6 digit number"),
    confirmPassword: zod_1.z.string().min(1, "Confirm Password is required"),
};
