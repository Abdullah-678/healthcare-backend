/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { Role, UserStatus } from "../../generated/prisma/enums";

import { prisma } from "../lib/prisma";

import { jwtUtils } from "../utils/jwt";
import { cookeiUtils } from "../utils/cookie";
import { AppError } from "../errorHelpers/appError";
import { envVars } from "../../config/env";
import { auth } from "../lib/auth";

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //Session Token Verification
      const sessionToken = cookeiUtils.getCookie(
        req,
        "better-auth.session_token",
      );

      if (!sessionToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! No session token provided.",
        );
      }

      let user;

      // Try Better Auth session first
      const betterAuthSession = await auth.api.getSession({
        headers: {
          Cookie: `better-auth.session_token=${sessionToken}`,
        },
      });

      if (betterAuthSession?.user) {
        user = betterAuthSession.user;
      } else {
        // Fallback to Prisma session lookup
        const sessionExists = await prisma.session.findFirst({
          where: {
            token: sessionToken,
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            user: true,
          },
        });

        if (!sessionExists || !sessionExists.user) {
          throw new AppError(
            status.UNAUTHORIZED,
            "Unauthorized access! Invalid or expired session.",
          );
        }

        user = sessionExists.user;
      }

      if (
        user.status === UserStatus.BLOCKED ||
        user.status === UserStatus.DELETED
      ) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! User is not active.",
        );
      }

      if (user.isDeleted) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! User is deleted.",
        );
      }

      if (authRoles.length > 0 && !authRoles.includes(user.role as Role)) {
        throw new AppError(
          status.FORBIDDEN,
          "Forbidden access! You do not have permission to access this resource.",
        );
      }

      req.user = {
        userId: user.id,
        role: user.role as Role,
        email: user.email,
      };

      //Access Token Verification
      const accessToken = cookeiUtils.getCookie(req, "accessToken");

      if (!accessToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! No access token provided.",
        );
      }

      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET,
      );

      if (!verifiedToken.success) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! Invalid access token.",
        );
      }

      if (
        authRoles.length > 0 &&
        !authRoles.includes(verifiedToken.data!.role as Role)
      ) {
        throw new AppError(
          status.FORBIDDEN,
          "Forbidden access! You do not have permission to access this resource.",
        );
      }

      // console.log("REQ.USER BEFORE NEXT:", req.user);
      // console.log("VERIFIED TOKEN:", verifiedToken.data);

      next();
    } catch (error: any) {
      next(error);
    }
  };
