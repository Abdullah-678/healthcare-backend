import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { authServices } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import { AppError } from "../../errorHelpers/appError";
import { cookeiUtils } from "../../utils/cookie";
import { email } from "zod";
import { envVars } from "../../../config/env";
import { auth } from "../../lib/auth";

const registerPatient = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await authServices.registerPatient(payload);
  const { accessToken, refreshToken, token, ...rest } = result;
  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshToken(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);
  sendResponse(res, {
    htttpStatusCode: status.CREATED,
    success: true,
    message: "patient registered successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await authServices.loginUser(payload);
  const { accessToken, refreshToken, token, ...rest } = result;
  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshToken(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);
  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "user logged in successfully",
    data: {
      token,
      accessToken,
      refreshToken,
      ...rest,
    },
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError(status.NOT_FOUND, "user doesn't exist!");
  }
  const result = await authServices.getMe(user);
  sendResponse(res, {
    htttpStatusCode: 200,
    success: true,
    message: "get me fetched successfully",
    data: result,
  });
});

const getNewToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const betterAuthSessionToken = req.cookies["better-auth.session_token"];
  if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED, "Refresh token is missing");
  }

  const result = await authServices.getNewToken(
    refreshToken,
    betterAuthSessionToken,
  );
  const { accessToken, refreshToken: newRefreshToken, sessionToken } = result;

  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshToken(res, newRefreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, betterAuthSessionToken);

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "new token generated successfully",
    data: {
      accessToken,
      refreshToken: newRefreshToken,
      sessionToken,
    },
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const betterAuthSessionToken = req.cookies["better-auth.session_token"];
  const result = await authServices.changePassword(
    payload,
    betterAuthSessionToken,
  );
  const { accessToken, refreshToken, token } = result;
  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshToken(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token as string);
  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "password change successfully",
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const betterAuthSessionToken = req.cookies["better-auth.session_token"];
  const result = await authServices.logoutUser(betterAuthSessionToken);
  cookeiUtils.clearCookie(res, "accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  cookeiUtils.clearCookie(res, "refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  cookeiUtils.clearCookie(res, "better-auth.session_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "logout successfully",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  await authServices.verifyEmail(email, otp);

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "email verified successfully",
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authServices.forgetPassword(email);

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "password reset otp sent to email successfully",
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  await authServices.resetPassword(email, otp, newPassword);

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "password reset successfully",
  });
});

const googleLogin = catchAsync((req: Request, res: Response) => {
  const redirectPath = req.query.redirect || "/dashboard";
  const encodedRedirectPath = encodeURIComponent(redirectPath as string);
  const callBackUrl = `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success?redirect=${encodedRedirectPath}`;
  res.render("googleRedirect", {
    callbackURL: callBackUrl,
    betterAuthUrl: envVars.BETTER_AUTH_URL,
  });
});
const googleLoginSuccess = catchAsync(async (req: Request, res: Response) => {
  const redirectPath = (req.query.redirect as string) || "/dashboard";
  const sessionToken = req.cookies["better-auth.session_token"];
  if (!sessionToken) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=oauth_failed`);
  }

  const session = await auth.api.getSession({
    headers: {
      Cookie: `better-auth.session_token=${sessionToken}`,
    },
  });
  if (!session) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_session_found`);
  }

  if (session && !session.user) {
    return res.redirect(`${envVars.FRONTEND_URL}/login?error=no_user_found`);
  }

  const result = await authServices.googleLoginSuccess(session);
  const { accessToken, refreshToken } = result;
  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshToken(res, refreshToken);

  const isValidRedirectPath =
    redirectPath.startsWith("/") && !redirectPath.startsWith("//");
  const finalRedirectPath = isValidRedirectPath ? redirectPath : "/dashboard";
  res.redirect(`${envVars.FRONTEND_URL}${finalRedirectPath}`);
});
const handleOAuthError = catchAsync((req: Request, res: Response) => {
  const error = (req.query.error as string) || "oauth_failed";
  res.redirect(`${envVars.FRONTEND_URL}/login?error=${error}`);
});

export const authControllers = {
  registerPatient,
  loginUser,
  getMe,
  getNewToken,
  changePassword,
  logout,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLogin,
  googleLoginSuccess,
  handleOAuthError,
};
