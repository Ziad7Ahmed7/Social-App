import { v4 as uuidv4 } from "uuid";
import type { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { sign, verify } from "jsonwebtoken";
import { HUserDocument, RoleEnum, UserModel } from "../../DB/models/User.model";
import {
  badRequestException,
  UnauthorizedException,
} from "../responses/error.response";
import { UserRepository } from "../../DB/repository/user.repository";
import { TokenRepository } from "../../DB/repository/token.repository";
import { HTokenDocument, TokenModel } from "../../DB/models/Token.model";

export enum SignatureLevelEnum {
  Bearer = "Bearer",
  System = "System",
}
export enum TokenEnum {
  access = "access",
  refresh = "refresh",
}
export enum LogoutEnum {
  only = "only",
  all = "all",
}

export const generateToken = async ({
  payload,
  secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
  options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRE_IN) },
}: {
  payload: object;
  secret?: Secret;
  options?: SignOptions;
}): Promise<string> => {
  return sign(payload, secret, options);
};
export const verifyToken = async ({
  token,
  secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
}: {
  token: string;
  secret?: Secret;
}): Promise<JwtPayload> => {
  return verify(token, secret) as JwtPayload;
};

export const detectSignatureLevel = async (
  role: RoleEnum = RoleEnum.user
): Promise<SignatureLevelEnum> => {
  let signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer;
  switch (role) {
    case "admin":
      signatureLevel = SignatureLevelEnum.System;
      break;
    case "user":
      signatureLevel = SignatureLevelEnum.Bearer;
      break;
    default:
      signatureLevel = SignatureLevelEnum.Bearer;
  }

  return signatureLevel;
};
export const getSignture = async (
  signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer
): Promise<{ access_signature: string; refresh_signature: string }> => {
  let signatures: { access_signature: string; refresh_signature: string } = {
    access_signature: "",
    refresh_signature: "",
  };
  switch (signatureLevel) {
    case SignatureLevelEnum.System:
      signatures.access_signature = process.env
        .ACCESS_SYSTEM_TOKEN_SIGNATURE as string;
      signatures.refresh_signature = process.env
        .REFRESH_SYSTEM_TOKEN_SIGNATURE as string;
      break;
    default:
      signatures.access_signature = process.env
        .ACCESS_USER_TOKEN_SIGNATURE as string;
      signatures.refresh_signature = process.env
        .REFRESH_USER_TOKEN_SIGNATURE as string;
      break;
  }

  return signatures;
};

export const createLoginCredential = async (user: HUserDocument) => {
  const signatureLevel = await detectSignatureLevel(user.role as RoleEnum);
  const signatures = await getSignture(signatureLevel);

  console.log({ signatureLevel, signatures });

  const jwtid = uuidv4();
  const accessToken = await generateToken({
    payload: { _id: user._id },
    secret: signatures.access_signature,
    options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRE_IN), jwtid },
  });
  const refreshToken = await generateToken({
    payload: { _id: user._id },
    secret: signatures.refresh_signature,
    options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRE_IN), jwtid },
  });

  return { accessToken, refreshToken };
};

export const decodeToken = async ({
  authorization,
  tokenType = TokenEnum.access,
}: {
  authorization: string;
  tokenType?: TokenEnum;
}) => {
  const userModel = new UserRepository(UserModel);
  const tokenModel = new TokenRepository(TokenModel);
  const [bearerKey, token] = authorization.split(" ");
  if (!token || !bearerKey) {
    throw new UnauthorizedException("missing token parts");
  }

  const signatures = await getSignture(bearerKey as SignatureLevelEnum);
  const decoded = await verifyToken({
    token,
    secret:
      tokenType === TokenEnum.access
        ? signatures.access_signature
        : signatures.refresh_signature,
  });
  if (!decoded?._id || !decoded?.iat) {
    throw new badRequestException("invalid token");
  }

  if (await tokenModel.findOne({ filter: { jti: decoded.jti } })) {
    {
      throw new UnauthorizedException("token is revoked");
    }
  }

  const user = await userModel.findOne({ filter: { _id: decoded._id } });
  if (!user) {
    throw new badRequestException("user not found");
  }

  if (
    user.changedCredntialTime?.getTime() ||
    0 > ((decoded.iat * 1000) as number)
  ) {
    throw new UnauthorizedException("token is revoked");
  }
  return { user, decoded };
};


export const createRevokedToken = async (decoded:JwtPayload):Promise<HTokenDocument>=>{
    const tokenModel = new TokenRepository(TokenModel);

  const [result] =  await tokenModel.create({
     data: [
       {
         jti: decoded?.jti as string,
         expiresIn:
           (decoded?.iat as number) +
           Number(process.env.REFRESH_TOKEN_EXPIRE_IN),
         userId: decoded?._id,
       },
     ],
   }) ||[];
   if(!result){
    throw new badRequestException("failed to revoke token")
   }
   return result;
}