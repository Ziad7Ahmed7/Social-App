import { Request, Response, NextFunction } from "express";
import type { ZodError, ZodType } from "zod";
import { badRequestException } from "../utils/responses/error.response";
import { z } from "zod";

type KeyType = keyof Request;
type SchemaType = Partial<Record<KeyType, ZodType>>;

type ValidationErrorType = Array<{
  key: KeyType;
  issues: Array<{
    message: string;
    path: string | number | symbol | undefined;
  }>;
}>;

export const validateRequest = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction): NextFunction => {
    const validationErrors: ValidationErrorType = [];

    for (const key of Object.keys(schema) as KeyType[]) {
      const zodSchema = schema[key];
      if (!zodSchema) continue;

      const parseResult = zodSchema.safeParse(req[key]);
      if (!parseResult.success) {
        const errors = parseResult.error as ZodError;
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
      throw new badRequestException("Validation failed", { validationErrors });
    }

    return next() as unknown as NextFunction;
  };
};

export const generalFeilds = {
  fullName: z.string().min(3, "Full name must be at least 3 characters long"),
  password: z
    .string()
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      "Password must be at least 8 characters long and contain at least one letter and one number"
    ),
  email: z.email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6 digit number"),
  confirmPassword: z.string().min(1, "Confirm Password is required"),
};