import status from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { IChangePasswordPayload } from "./auth.interface";
import { email } from "zod";

interface IRegisterPatient {
  name: string;
  email: string;
  password: string;
}

const registerPatient = async (payload: IRegisterPatient) => {
  const { name, email, password } = payload;
  const data = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  if (!data.user) {
    throw new Error("Failed to register patient");
  }

  try {
    const patient = await prisma.$transaction(async (tx) => {
      const patientTx = await tx.patient.create({
        data: {
          userId: data.user.id,
          name: payload.name,
          email: payload.email,
        },
      });
      return patientTx;
    });

    const accessToken = tokenUtils.getAccessToken({
      userId: data.user.id,
      role: data.user.role,
      name: data.user.name,
      email: data.user.email,
      status: data.user.status,
      isDeleted: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });
    const refreshToken = tokenUtils.getRefreshToken({
      userId: data.user.id,
      role: data.user.role,
      name: data.user.name,
      email: data.user.email,
      status: data.user.status,
      isDeleted: data.user.isDeleted,
      emailVerified: data.user.emailVerified,
    });

    return {
      ...data,
      patient,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("transaction error", error);
    await prisma.user.delete({
      where: {
        id: data.user.id,
      },
    });
    throw error;
  }
};

const loginUser = async (payload: IRegisterPatient) => {
  const { email, password } = payload;
  const data = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });

  if (data.user.status === UserStatus.BLOCKED) {
    throw new Error("User is blocked");
  }
  if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
    throw new Error("User is deleted");
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: data.user.id,
    role: data.user.role,
    name: data.user.name,
    email: data.user.email,
    status: data.user.status,
    isDeleted: data.user.isDeleted,
    emailVerified: data.user.emailVerified,
  });
  return {
    ...data,
    accessToken,
    refreshToken,
  };
};

const getMe = async (user: IRequestUser) => {
  const userExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    include: {
      patient: {
        include: {
          appointments: true,
          reviews: true,
          prescriptions: true,
          medicalReports: true,
          patientHealthData: true,
        },
      },
      doctor: {
        include: {
          specialties: true,
          appointments: true,
          reviews: true,
          prescriptions: true,
        },
      },
      admin: true,
    },
  });

  if (!userExists) {
    throw new AppError(status.NOT_FOUND, "user does not exists!");
  }
  return userExists;
};

const getNewToken = async (refreshToken: string, sessionToken: string) => {
  const isSessionTokenExists = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!isSessionTokenExists) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }

  const verifydRefreshToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.REFRESH_TOKEN_SECRET,
  );

  if (!verifydRefreshToken.success && verifydRefreshToken.err) {
    throw new AppError(status.UNAUTHORIZED, "Invalid Refresh Token");
  }

  const data = verifydRefreshToken.data as JwtPayload;
  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });
  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    status: data.status,
    isDeleted: data.isDeleted,
    emailVerified: data.emailVerified,
  });

  const { token } = await prisma.session.update({
    where: {
      token: sessionToken,
    },
    data: {
      token: sessionToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
      updatedAt: new Date(),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionToken: token,
  };
};

const changePassword = async (
  payload: IChangePasswordPayload,
  sessionToken: string,
) => {
  const session = await auth.api.getSession({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });
  if (!session) {
    throw new AppError(status.UNAUTHORIZED, "Invalid session token");
  }

  const { currentPassword, newPassword } = payload;

  const result = await auth.api.changePassword({
    body: {
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    },
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });

  if (session.user.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
    email: session.user.email,
    status: session.user.status,
    isDeleted: session.user.isDeleted,
    emailVerified: session.user.emailVerified,
  });

  return {
    ...result,
    accessToken,
    refreshToken,
  };
};

const logoutUser = async (sessionToken: string) => {
  const result = await auth.api.signOut({
    headers: new Headers({
      Authorization: `Bearer ${sessionToken}`,
    }),
  });
  return result;
};

const verifyEmail = async (email: string, otp: string) => {
  const result = await auth.api.verifyEmailOTP({
    body: {
      email,
      otp,
    },
  });

  if (result.status && !result.user.emailVerified) {
    await prisma.user.update({
      where: {
        email,
      },
      data: {
        emailVerified: true,
      },
    });
  }
};

const forgetPassword = async (email: string) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "user not found");
  }
  if (!isUserExists.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "email not verified");
  }
  if (isUserExists.isDeleted || isUserExists.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, "user not found");
  }
  await auth.api.requestPasswordResetEmailOTP({
    body: {
      email,
    },
  });
};

const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExists) {
    throw new AppError(status.NOT_FOUND, "user not found");
  }
  if (!isUserExists.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "email not verified");
  }
  if (isUserExists.isDeleted || isUserExists.status === UserStatus.DELETED) {
    throw new AppError(status.NOT_FOUND, "user not found");
  }

  await auth.api.resetPasswordEmailOTP({
    body: {
      email,
      otp,
      password: newPassword,
    },
  });

  if (isUserExists.needPasswordChange) {
    await prisma.user.update({
      where: {
        id: isUserExists.id,
      },
      data: {
        needPasswordChange: false,
      },
    });
  }

  await prisma.session.deleteMany({
    where: {
      userId: isUserExists.id,
    },
  });
};

const googleLoginSuccess = async (session: Record<string, any>) => {
  const isPatientExists = await prisma.patient.findUnique({
    where: {
      userId: session.user.id,
    },
  });
  if (!isPatientExists) {
    await prisma.patient.create({
      data: {
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  }
  const accessToken = tokenUtils.getAccessToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name,
  });
  return {
    accessToken,
    refreshToken,
  };
};

export const authServices = {
  registerPatient,
  loginUser,
  getMe,
  getNewToken,
  changePassword,
  logoutUser,
  verifyEmail,
  forgetPassword,
  resetPassword,
  googleLoginSuccess,
};
