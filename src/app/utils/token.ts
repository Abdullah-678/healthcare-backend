import { JwtPayload, SignOptions } from "jsonwebtoken";
import { jwtUtils } from "./jwt";
import { envVars } from "../../config/env";
import { Response } from "express";
import { cookeiUtils } from "./cookie";

const authCookieOptions = () => {
  const secure = envVars.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    path: "/",
  };
};

const getAccessToken = (payload: JwtPayload) => {
  const accessToken = jwtUtils.createToken(
    payload,
    envVars.ACCESS_TOKEN_SECRET,
    { expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN } as SignOptions,
  );
  return accessToken;
};

const getRefreshToken = (payload: JwtPayload) => {
  const refreshToken = jwtUtils.createToken(
    payload,
    envVars.REFRESH_TOKEN_SECRET,
    { expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN } as SignOptions,
  );
  return refreshToken;
};

const setAccessTokenCookie = (res: Response, token: string) => {
  cookeiUtils.setCookie(res, "accessToken", token, {
    ...authCookieOptions(),
    maxAge: 60 * 60 * 24 * 1000,
  });
};
const setRefreshToken = (res: Response, token: string) => {
  cookeiUtils.setCookie(res, "refreshToken", token, {
    ...authCookieOptions(),
    maxAge: 60 * 60 * 24 * 7 * 1000,
  });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  cookeiUtils.setCookie(res, "better-auth.session_token", token, {
    ...authCookieOptions(),
    maxAge: 60 * 60 * 24 * 1000,
  });
};

const clearAuthCookies = (res: Response) => {
  for (const name of [
    "accessToken",
    "refreshToken",
    "better-auth.session_token",
  ]) {
    cookeiUtils.clearCookie(res, name, authCookieOptions());
  }
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshToken,
  setBetterAuthSessionCookie,
  clearAuthCookies,
};
