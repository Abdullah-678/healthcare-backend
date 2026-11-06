import status from "http-status";
import { UserStatus } from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { IUpdateAdminPayload } from "./admin.interface";
import { AppError } from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { auth } from "../../lib/auth";
import { Role } from "../../../generated/prisma/enums";
import { ICreateAdminPayload } from "./admin.interface";

const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  emailVerified: true,
  createdAt: true,
} as const;

const getAllAdmins = async () => {
  const admins = await prisma.admin.findMany({
    where: {
      isDeleted: false,
      user: { isDeleted: false },
    },
    select: {
      id: true,
      name: true,
      email: true,
      profilePhoto: true,
      contactNumber: true,
      createdAt: true,
      user: { select: safeUserSelect },
    },
  });
  return admins;
};

const createAdmin = async (payload: ICreateAdminPayload) => {
  const email = payload.admin.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(status.CONFLICT, "A user with this email already exists");
  }

  const createdUser = await auth.api.signUpEmail({
    body: {
      email,
      password: payload.password,
      role: Role.ADMIN,
      name: payload.admin.name,
      needPasswordChange: true,
    },
  });

  try {
    return await prisma.admin.create({
      data: {
        ...payload.admin,
        email,
        userId: createdUser.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        createdAt: true,
        user: { select: safeUserSelect },
      },
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: createdUser.user.id } });
    throw error;
  }
};

const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findFirst({
    where: { id, isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      profilePhoto: true,
      contactNumber: true,
      createdAt: true,
      user: { select: safeUserSelect },
    },
  });

  if (!admin) {
    throw new AppError(status.NOT_FOUND, "Admin or Super Admin not found");
  }

  return admin;
};

const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
  const isAdminExist = await prisma.admin.findFirst({
    where: { id, isDeleted: false },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
  }

  const { admin } = payload;

  const updatedAdmin = await prisma.$transaction(async (tx) => {
    if (admin?.name) {
      await tx.user.update({
        where: { id: isAdminExist.userId },
        data: { name: admin.name },
      });
    }

    return tx.admin.update({
      where: { id },
      data: admin ?? {},
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        createdAt: true,
        user: { select: safeUserSelect },
      },
    });
  });

  return updatedAdmin;
};

const deleteAdmin = async (id: string, user: IRequestUser) => {
  const isAdminExist = await prisma.admin.findFirst({
    where: { id, isDeleted: false },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
  }

  if (isAdminExist.userId === user.userId) {
    throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
  }

  return prisma.$transaction(async (tx) => {
    await tx.admin.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: isAdminExist.userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.DELETED,
      },
    });

    await tx.session.deleteMany({
      where: { userId: isAdminExist.userId },
    });

    await tx.account.deleteMany({
      where: { userId: isAdminExist.userId },
    });

    return tx.admin.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        createdAt: true,
        isDeleted: true,
        user: { select: safeUserSelect },
      },
    });
  });
};

export const AdminService = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
