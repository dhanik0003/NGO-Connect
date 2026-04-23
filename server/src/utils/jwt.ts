import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

const accessTokenOptions: SignOptions = {
  expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
};

const refreshTokenOptions: SignOptions = {
  expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions["expiresIn"],
};

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, accessTokenOptions);

export const signRefreshToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshTokenOptions);

export const verifyAccessToken = (token: string) => jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

export const verifyRefreshToken = (token: string) => jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
