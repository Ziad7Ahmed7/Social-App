import { Router } from "express";
import AuthentcationService from "./auth.service";
import { validateRequest } from "../../middleware/validation.middleware";
import * as validators from './auth.validation';

const router = Router();

router.post(
  "/login",
  validateRequest(validators.loginSchema),
  AuthentcationService.login
);


router.patch(
  "/confirm-email",
  validateRequest(validators.confirmEmailSchema),
  AuthentcationService.confirmEmail
);



router.post(
  "/signup",
  validateRequest(validators.signupSchema),
  AuthentcationService.signup
);


router.post(
  "/signup-gmail",
  validateRequest(validators.signupWithGmailSchema),
  AuthentcationService.signupWithGmail
);


router.post(
  "/login-gmail",
  validateRequest(validators.signupWithGmailSchema),
  AuthentcationService.loginWithGmail
);
 
router.patch(
  "/send-forgot-password",
  validateRequest(validators.sendForgotCode),
  AuthentcationService.sendForgotCode
);



router.patch(
  "/verify-forgot-password",
  validateRequest(validators.verifyForgotPassword ),
  AuthentcationService.sendForgotCode
);


router.patch(
  "/reset-forgot-password",
  validateRequest(validators.resetForgotPassword ),
  AuthentcationService.resetForgotPassword
);
 
export default router;