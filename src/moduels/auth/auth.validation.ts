import {  z } from "zod";
import { generalFeilds } from "../../middleware/validation.middleware";


export const loginSchema = {body:z
  .strictObject({
    password: generalFeilds.password,
    email: generalFeilds.email,
    confirmPassword: generalFeilds.confirmPassword,
  })
}
export const signupSchema = {body:loginSchema.body.extend({
    fullName: generalFeilds.fullName,
    confirmPassword: generalFeilds.confirmPassword,
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
  
}
export const confirmEmailSchema = {body:z.strictObject({
    email: generalFeilds.email,
    otp: generalFeilds.otp,
  })

  
}




export const signupWithGmailSchema = {
  body: z.strictObject({
    idToken:z.string()
  }),
};



export const sendForgotCode = {
  body: z.strictObject({
    email: generalFeilds.email,
  }),
};


export const verifyForgotPassword = {
  body: sendForgotCode.body.extend({
    otp: generalFeilds.otp,
  }),
};



export const resetForgotPassword = {
  body: sendForgotCode.body.extend({
    otp: generalFeilds.otp,
    password: generalFeilds.password,
    confirmPassword: generalFeilds.confirmPassword,
  }).refine((data) => {
    return data.password === data.confirmPassword;
  },{message:"Passwords do not match",path:["confirmPassword"]}),
};