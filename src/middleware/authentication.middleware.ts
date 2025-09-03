import type { NextFunction, Request, Response } from "express";
import { decodeToken, TokenEnum } from "../utils/security/token.security";
import { badRequestException, ForbiddenException } from "../utils/responses/error.response";
import { RoleEnum } from "../DB/models/User.model";

export const authentication = (tokenType: TokenEnum= TokenEnum.access) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      throw new badRequestException("missing authorization header");
    }
    const { decoded, user } = await decodeToken({
      authorization: req.headers.authorization,
      tokenType,
    });

    req.user = user;
    req.decoded = decoded;
    next();
  };
};
export const authorization = (
  accessRoles: RoleEnum[] = [],
  tokenType: TokenEnum = TokenEnum.access
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      throw new badRequestException("missing authorization header");
    }
    const { decoded, user } = await decodeToken({
      authorization: req.headers.authorization,
      tokenType,
    });
    if (!accessRoles.includes(user.role)) {
      throw new ForbiddenException("you are not allowed to access this route");
    }

    req.user = user;
    req.decoded = decoded;
    next();
  };
};
