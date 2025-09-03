// export interface SignupDTO {
//     fullName: string;
//     password: string;
//     email: string;
// }
import { z } from "zod";
import * as validators from './auth.validation';
 

export type SignupDTO = z.infer<typeof validators.signupSchema.body>;
export type LoginDTO = z.infer<typeof validators.loginSchema.body>;
export type SendForgotCodeDTO = z.infer<typeof validators.sendForgotCode.body>;
export type verifyForgotPasswordDTO = z.infer<typeof validators.verifyForgotPassword.body>;
export type resetForgotPasswordDTO = z.infer<typeof validators.resetForgotPassword.body>;
export type ConfirmEmailDTO = z.infer<typeof validators.confirmEmailSchema.body>;
export type IGmail = z.infer<typeof validators.signupWithGmailSchema.body>;