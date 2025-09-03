"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetForgotPassword = exports.verifyForgotPassword = exports.sendForgotCode = exports.signupWithGmailSchema = exports.confirmEmailSchema = exports.signupSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middleware/validation.middleware");
exports.loginSchema = { body: zod_1.z
        .strictObject({
        password: validation_middleware_1.generalFeilds.password,
        email: validation_middleware_1.generalFeilds.email,
        confirmPassword: validation_middleware_1.generalFeilds.confirmPassword,
    })
};
exports.signupSchema = { body: exports.loginSchema.body.extend({
        fullName: validation_middleware_1.generalFeilds.fullName,
        confirmPassword: validation_middleware_1.generalFeilds.confirmPassword,
    })
        .superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Passwords do not match",
            });
        }
        if (data.fullName?.split(" ").length < 2) {
            ctx.addIssue({
                code: "custom",
                path: ["fullName"],
                message: "Full name must contain at least two parts ex: John Doe",
            });
        }
    })
};
exports.confirmEmailSchema = { body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFeilds.email,
        otp: validation_middleware_1.generalFeilds.otp,
    })
};
exports.signupWithGmailSchema = {
    body: zod_1.z.strictObject({
        idToken: zod_1.z.string()
    }),
};
exports.sendForgotCode = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFeilds.email,
    }),
};
exports.verifyForgotPassword = {
    body: exports.sendForgotCode.body.extend({
        otp: validation_middleware_1.generalFeilds.otp,
    }),
};
exports.resetForgotPassword = {
    body: exports.sendForgotCode.body.extend({
        otp: validation_middleware_1.generalFeilds.otp,
        password: validation_middleware_1.generalFeilds.password,
        confirmPassword: validation_middleware_1.generalFeilds.confirmPassword,
    }).refine((data) => {
        return data.password === data.confirmPassword;
    }, { message: "Passwords do not match", path: ["confirmPassword"] }),
};
