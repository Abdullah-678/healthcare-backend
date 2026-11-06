import status from "http-status";
import { Role, UserStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../errorHelpers/appError";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import {
  ICreatePatientPayload,
  IUpdatePatientPayload,
} from "./patient.interface";

const safeUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  emailVerified: true,
  createdAt: true,
} as const;

const getAllPatients = async () =>
  prisma.patient.findMany({
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
      address: true,
      createdAt: true,
      user: { select: safeUserSelect },
    },
    orderBy: { createdAt: "desc" },
  });

const getPatientById = async (id: string) => {
  const patient = await prisma.patient.findFirst({
    where: { id, isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      profilePhoto: true,
      contactNumber: true,
      address: true,
      createdAt: true,
      user: { select: safeUserSelect },
    },
  });

  if (!patient) {
    throw new AppError(status.NOT_FOUND, "Patient not found");
  }

  return patient;
};

const createPatient = async (payload: ICreatePatientPayload) => {
  const email = payload.patient.email.trim().toLowerCase();
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
      role: Role.PATIENT,
      name: payload.patient.name,
      needPasswordChange: true,
    },
  });

  try {
    return await prisma.patient.create({
      data: {
        ...payload.patient,
        email,
        userId: createdUser.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        address: true,
        createdAt: true,
        user: { select: safeUserSelect },
      },
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: createdUser.user.id } });
    throw error;
  }
};

const updatePatient = async (id: string, payload: IUpdatePatientPayload) => {
  const existingPatient = await prisma.patient.findFirst({
    where: { id, isDeleted: false },
  });

  if (!existingPatient) {
    throw new AppError(status.NOT_FOUND, "Patient not found");
  }

  const updateData = payload.patient ?? {};
  return prisma.$transaction(async (tx) => {
    if (updateData.name) {
      await tx.user.update({
        where: { id: existingPatient.userId },
        data: { name: updateData.name },
      });
    }

    return tx.patient.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        address: true,
        createdAt: true,
        isDeleted: true,
        user: { select: safeUserSelect },
      },
    });
  });
};

const deletePatient = async (id: string) => {
  const patient = await prisma.patient.findFirst({
    where: { id, isDeleted: false },
  });

  if (!patient) {
    throw new AppError(status.NOT_FOUND, "Patient not found");
  }

  return prisma.$transaction(async (tx) => {
    await tx.patient.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await tx.user.update({
      where: { id: patient.userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.DELETED,
      },
    });

    await tx.session.deleteMany({ where: { userId: patient.userId } });
    await tx.account.deleteMany({ where: { userId: patient.userId } });

    return tx.patient.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        contactNumber: true,
        address: true,
        createdAt: true,
        isDeleted: true,
        user: { select: safeUserSelect },
      },
    });
  });
};

export const PatientService = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
};
