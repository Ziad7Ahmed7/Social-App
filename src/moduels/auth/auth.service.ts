import { Request, Response, NextFunction } from "express";
// import { badRequestException } from "../../utils/responses/error.response";
import {
  ConfirmEmailDTO,
  LoginDTO,
  SignupDTO,
  IGmail,
  SendForgotCodeDTO,
  verifyForgotPasswordDTO,
  resetForgotPasswordDTO,
} from "./auth.dto";
import { ProviderEnum, UserModel } from "../../DB/models/User.model";
import {
  badRequestException,
  ConflictException,
  notFoundException,
} from "../../utils/responses/error.response";
import { UserRepository } from "../../DB/repository/user.repository";
import { compareHash, generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/event/email.event";
import { generateOtpNumber } from "../../utils/otp";
import { createLoginCredential } from "../../utils/security/token.security";
import { OAuth2Client, type TokenPayload } from "google-auth-library";

// import * as validators from './auth.validation';

class AuthentcationService {
  private userModel = new UserRepository(UserModel);
  constructor() {}

  /**
   *
   * @param req - Express.Request
   * @param res - Express.Response
   * @param next - Express.NextFunction
   * @returns  Promise<Response>
   * @example
   * // Example usage: Signup a new user
   */

  private async verifyGmailAccount(idToken: string): Promise<TokenPayload> {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.WEB_CLIENT_IDS?.split(",") || [],
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new badRequestException("Gmail account not verified");
    }
    return payload;
  }

  signupWithGmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const { idToken }: IGmail = req.body;
    const { email, family_name, given_name, picture }: TokenPayload =
      await this.verifyGmailAccount(idToken);

    const user = await this.userModel.findOne({
      filter: { email },
    });
    if (user) {
      if (user.provider === ProviderEnum.GOOGLE) {
        return await this.loginWithGmail(req, res, next);
      }
      throw new ConflictException("User already exists with this email");
    }

    const [newUser] =
      (await this.userModel.create({
        data: [
          {
            firstName: given_name as string,
            email: email as string,
            lastName: family_name as string,
            profileImage: picture as string,
            confirmedAt: new Date(),
            provider: ProviderEnum.GOOGLE,
          },
        ],
      })) || [];
    if (!newUser) {
      throw new badRequestException("User not created");
    }

    const credential = await createLoginCredential(newUser);

    return res
      .status(201)
      .json({ message: "signup with gmail", data: { credential } });
  };

  loginWithGmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const { idToken }: IGmail = req.body;
    const { email }: TokenPayload = await this.verifyGmailAccount(idToken);

    const user = await this.userModel.findOne({
      filter: { email, provider: ProviderEnum.GOOGLE },
    });
    if (!user) {
      throw new notFoundException("Not registered with this email");
    }

    const credential = await createLoginCredential(user);

    return res.json({ message: "login with gmail", data: { credential } });
  };

  signup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    let { fullName, password, email }: SignupDTO = req.body;
    console.log({ fullName, password, email });

    const checkUserExists = await this.userModel.findOne({
      filter: { email },
      select: "email",
      options: { lean: true },
    });
    console.log(checkUserExists);
    if (checkUserExists) {
      throw new ConflictException("User already exists with this email");
    }

    // Logic for user signup
    // throw new badRequestException('fail',{ extra: "Invalid data provided"});
    const otp = generateOtpNumber();
    const user = await this.userModel.createUser({
      data: [
        {
          fullName,
          email,
          password: await generateHash(password),
          confirmEmailOtp: await generateHash(String(otp)),
        },
      ],
    });

    emailEvent.emit("confirmEmail", { to: email, otp: otp });

    return res
      .status(201)
      .json({ message: "User signed up successfully!", data: { user } });
  };

  confirmEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    // Logic for user login
    const { email, otp }: ConfirmEmailDTO = req.body;
    const user = await this.userModel.findOne({
      filter: {
        email,
        confirmEmailOtp: { $exists: true },
        confirmedAt: { $exists: false },
      },
    });
    if (!user) {
      throw new notFoundException("Invalid email or already confirmed");
    }
    if (!(await compareHash(otp, user.confirmEmailOtp as string))) {
      throw new ConflictException("Invalid Confirmation Code");
    }
    await this.userModel.updateOne({
      filter: { email },
      update: { $unset: { confirmEmailOtp: true }, confirmedAt: new Date() },
    });

    return res.status(200).json({ message: "User logged in successfully!" });
  };
  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const { email, password }: LoginDTO = req.body;
    const user = await this.userModel.findOne({
      filter: { email, provider: ProviderEnum.SYSTEM },
    });
    if (!user) {
      throw new notFoundException("Invalid email or password");
    }
    if (!user.confirmedAt) {
      throw new badRequestException("Please confirm your email first");
    }
    if (!compareHash(password, user.password)) {
      throw new notFoundException("Invalid email or password");
    }
    const credential = await createLoginCredential(user);
    return res
      .status(200)
      .json({ message: "User logged in successfully!", data: { credential } });
  };

  sendForgotCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const { email }: SendForgotCodeDTO = req.body;
    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        confirmedAt: { $exists: true },
      },
    });
    if (!user) {
      throw new notFoundException("Invalid account");
    }

    const otp = generateOtpNumber();
    const result = await this.userModel.updateOne({
      filter: { email },
      update: { resetPasswordOtp: await generateHash(String(otp)) },
    });
    if (!result.matchedCount) {
      throw new badRequestException("Something went wrong");
    }
    emailEvent.emit("resetPassword", { to: email, otp: otp });
    return res.status(200).json({ message: "Done" });
  };

  verifyForgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const { email, otp }: verifyForgotPasswordDTO = req.body;
    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        resetPasswordOtp: { $exists: true },
      },
    });
    if (!user) {
      throw new notFoundException("Invalid account");
    }
    if (!(await compareHash(otp, user.resetPasswordOtp as string))) {
      throw new ConflictException("Invalid otp");
    }

    return res.status(200).json({ message: "Done" });
  };

  resetForgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response> => {
    const { email, otp, password }: resetForgotPasswordDTO = req.body;
    const user = await this.userModel.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        resetPasswordOtp: { $exists: true },
      },
    });
    if (!user) {
      throw new notFoundException("Invalid account");
    }
    if (!(await compareHash(otp, user.resetPasswordOtp as string))) {
      throw new ConflictException("Invalid otp");
    }
    if (!user) {
      throw new notFoundException("Invalid account");
    }

    const result = await this.userModel.updateOne({
      filter: { email },
      update: {
        $unset: { resetPasswordOtp: true },
        password: await generateHash(password),
        changedCredntialTime: new Date(),
      },
    });
    if (!result.matchedCount) {
      throw new badRequestException("Something went wrong");
    }

    return res.status(200).json({ message: "Done" });
  };
}

export default new AuthentcationService();
