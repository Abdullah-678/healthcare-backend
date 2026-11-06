import status from "http-status";
import {
  AppointmentStatus,
  PaymentStatus,
} from "../../../generated/prisma/enums";
import { AppError } from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreatePrescriptionPayload } from "./prescription.interface";

const createPrescription = async (
  user: IRequestUser,
  payload: ICreatePrescriptionPayload,
) => {
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: { email: user.email },
  });
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: payload.appointmentId },
  });

  if (appointment.doctorId !== doctor.id) {
    throw new AppError(
      status.FORBIDDEN,
      "You can only prescribe for your own appointments",
    );
  }

  if (appointment.status !== AppointmentStatus.COMPLETED) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only prescribe after the appointment is completed",
    );
  }

  if (appointment.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only prescribe after payment is completed",
    );
  }

  const existingPrescription = await prisma.prescription.findUnique({
    where: { appointmentId: appointment.id },
  });

  if (existingPrescription) {
    throw new AppError(
      status.CONFLICT,
      "A prescription already exists for this appointment",
    );
  }

  return prisma.prescription.create({
    data: {
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      followUpDate: payload.followUpDate,
      instructions: payload.instructions,
    },
  });
};

const getAllPrescriptions = async () =>
  prisma.prescription.findMany({
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
        },
      },
      patient: {
        select: {
          id: true,
          name: true,
        },
      },
      appointment: {
        include: {
          patient: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

export const PrescriptionService = {
  createPrescription,
  getAllPrescriptions,
};
