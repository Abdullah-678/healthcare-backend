import { JwtPayload, SignOptions } from "jsonwebtoken";
import { jwtUtils } from "./jwt";
import { envVars } from "../../config/env";
import { Response } from "express";
import { cookeiUtils } from "./cookie";
import ms, { StringValue } from "ms";
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
  // const maxAge = ms(envVars.ACCESS_TOKEN_EXPIRES_IN as StringValue);
  cookeiUtils.setCookie(res, "accessToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 1000,
  });
};
const setRefreshToken = (res: Response, token: string) => {
  // const maxAge = ms(envVars.REFRESH_TOKEN_EXPIRES_IN as StringValue);
  cookeiUtils.setCookie(res, "refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 7 * 1000,
  });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  // const maxAge = ms(envVars.REFRESH_TOKEN_EXPIRES_IN as StringValue);
  cookeiUtils.setCookie(res, "better-auth.session_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 1000,
  });
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshToken,
  setBetterAuthSessionCookie,
};
