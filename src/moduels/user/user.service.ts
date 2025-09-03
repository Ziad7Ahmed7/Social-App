import type { Request, Response } from "express";
import { ILogoutDTO } from "./user.dto";
import {
  createLoginCredential,
  createRevokedToken,
  LogoutEnum,
} from "../../utils/security/token.security";
import { UpdateQuery } from "mongoose";
import { HUserDocument, IUser, UserModel } from "../../DB/models/User.model";
import { UserRepository } from "../../DB/repository/user.repository";
import { TokenRepository } from "../../DB/repository/token.repository";
import { TokenModel } from "../../DB/models/Token.model";
import { JwtPayload } from "jsonwebtoken";

class UserService {
  private userModel = new UserRepository(UserModel);
  private TokenModel = new TokenRepository(TokenModel);

  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    return res.json({
      message: "User profile fetched successfully",
      data: { user: req.user?._id, decoded: req.decoded?.iat },
    });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag }: ILogoutDTO = req.body;
    let statusCode: number = 200;
    const update: UpdateQuery<IUser> = {};

    switch (flag) {
      case LogoutEnum.all:
        update.changedCredntialTime = new Date();
        break;
      default:
        await createRevokedToken(req.decoded as JwtPayload);
        statusCode = 201;
        break;
    }

    await this.userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update,
    });
    return res.status(statusCode).json({
      message: "User profile fetched successfully",
    });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credential = await createLoginCredential(req.user as HUserDocument);
    await createRevokedToken(req.decoded as JwtPayload);

    return res.status(201).json({
      message: "Token refreshed successfully",
      data: { credential },
    });
  };
}

export default new UserService();
