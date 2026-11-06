import status from "http-status";
// import { uuidv7 } from "zod/mini";
import { v7 as uuidv7 } from "uuid";
import { PaymentStatus, Role } from "../../../generated/prisma/enums";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { AppointmentStatus } from "./../../../generated/prisma/enums";
import { IBookAppointmentPayload } from "./appointment.interface";
import { envVars } from "../../../config/env";
import { AppError } from "../../errorHelpers/appError";
import { stripe } from "../../../config/stripe.config";

// Pay Now Book Appointment
const bookAppointment = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const videoCallingId = String(uuidv7());

  if (!payload.scheduleId) {
    const appointmentData = await prisma.appointment.create({
      data: {
        doctorId: doctorData.id,
        patientId: patientData.id,
        status: AppointmentStatus.REQUESTED,
        videoCallingId,
      },
    });

    return {
      appointment: appointmentData,
      payment: null,
      paymentUrl: null,
      requestPending: true,
    };
  }

  const scheduleId = payload.scheduleId;
  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: scheduleId,
    },
  });

  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
      },
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    const appointmentData = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        patientId: patientData.id,
        scheduleId: doctorSchedule.scheduleId,
        videoCallingId,
      },
    });

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    //TODO : Payment Integration will be here

    const transactionId = String(uuidv7());

    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Appointment with Dr. ${doctorData.name}`,
            },
            unit_amount: doctorData.appointmentFee * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        appointmentId: appointmentData.id,
        paymentId: paymentData.id,
      },

      success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${paymentData.id}&session_id={CHECKOUT_SESSION_ID}`,

      // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
      cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments`,
    });

    await tx.payment.update({
      where: { id: paymentData.id },
      data: {
        paymentGatewayData: { checkoutSessionId: session.id },
      },
    });

    return {
      appointmentData,
      paymentData,
      paymentUrl: session.url,
    };
  });

  return {
    appointment: result.appointmentData,
    payment: result.paymentData,
    paymentUrl: result.paymentUrl,
    requestPending: false,
  };
};

const getMyAppointments = async (user: IRequestUser) => {
  //user can be patient or doctor, so we need to check both
  const patientData = await prisma.patient.findUnique({
    where: {
      email: user?.email,
    },
  });

  const doctorData = await prisma.doctor.findUnique({
    where: {
      email: user?.email,
    },
  });

  let appointments = [];

  if (patientData) {
    appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  } else if (doctorData) {
    appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  } else {
    throw new Error("User not found");
  }

  return appointments;
};

// 1. Completed Or Cancelled Appointments should not be allowed to update status
// 2. Doctors can only update Appoinment status from schedule to inprogress or inprogress to complted or schedule to cancelled.
// 3. Patients can only cancel the scheduled appointment if it scheduled not completed or cancelled or inprogress.
// 4. Admin and Super admin can update to any status.

const changeAppointmentStatus = async (
  appointmentId: string,
  appointmentStatus: AppointmentStatus,
  user: IRequestUser,
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
      patient: true,
    },
  });

  if (user?.role === Role.DOCTOR) {
    if (user.email !== appointmentData.doctor.email) {
      throw new AppError(status.FORBIDDEN, "This is not your appointment");
    }

    const isAllowedDoctorTransition =
      (appointmentData.status === AppointmentStatus.SCHEDULED &&
        (appointmentStatus === AppointmentStatus.INPROGRESS ||
          appointmentStatus === AppointmentStatus.CANCELED)) ||
      (appointmentData.status === AppointmentStatus.INPROGRESS &&
        appointmentStatus === AppointmentStatus.COMPLETED);

    if (!isAllowedDoctorTransition) {
      throw new AppError(
        status.BAD_REQUEST,
        "Doctors can only start scheduled appointments, complete in-progress appointments, or cancel scheduled appointments",
      );
    }
  } else if (user?.role === Role.PATIENT) {
    if (user.email !== appointmentData.patient.email) {
      throw new AppError(status.FORBIDDEN, "This is not your appointment");
    }

    const canPatientCancel =
      (appointmentData.status === AppointmentStatus.REQUESTED ||
        appointmentData.status === AppointmentStatus.SCHEDULED) &&
      appointmentStatus === AppointmentStatus.CANCELED;

    if (!canPatientCancel) {
      throw new AppError(
        status.BAD_REQUEST,
        "Patients can only cancel requested or scheduled appointments",
      );
    }
  }

  return await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: appointmentStatus,
    },
  });
};

const scheduleAppointmentRequest = async (
  appointmentId: string,
  scheduleId: string,
  user: IRequestUser,
) => {
  const doctor = await prisma.doctor.findUniqueOrThrow({
    where: { email: user.email },
  });
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: appointmentId },
  });

  if (appointment.doctorId !== doctor.id) {
    throw new AppError(status.FORBIDDEN, "This is not your appointment");
  }
  if (
    appointment.status !== AppointmentStatus.REQUESTED ||
    appointment.scheduleId !== null
  ) {
    throw new AppError(
      status.CONFLICT,
      "Only unscheduled appointment requests can be scheduled",
    );
  }

  const doctorSchedule = await prisma.doctorSchedules.findUnique({
    where: {
      doctorId_scheduleId: {
        doctorId: doctor.id,
        scheduleId,
      },
    },
    include: { schedule: true },
  });

  if (!doctorSchedule || doctorSchedule.isBooked) {
    throw new AppError(
      status.BAD_REQUEST,
      "Choose one of your available schedule slots",
    );
  }
  if (doctorSchedule.schedule.startDateTime <= new Date()) {
    throw new AppError(status.BAD_REQUEST, "Choose a future schedule slot");
  }

  return prisma.$transaction(async (tx) => {
    const slotReservation = await tx.doctorSchedules.updateMany({
      where: {
        doctorId: doctor.id,
        scheduleId,
        isBooked: false,
      },
      data: { isBooked: true },
    });
    if (slotReservation.count !== 1) {
      throw new AppError(status.CONFLICT, "This schedule slot is no longer available");
    }

    const appointmentUpdate = await tx.appointment.updateMany({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
        status: AppointmentStatus.REQUESTED,
        scheduleId: null,
      },
      data: {
        scheduleId,
        status: AppointmentStatus.SCHEDULED,
      },
    });
    if (appointmentUpdate.count !== 1) {
      throw new AppError(
        status.CONFLICT,
        "This appointment request has already been updated",
      );
    }

    await tx.payment.create({
      data: {
        appointmentId,
        amount: doctor.appointmentFee,
        transactionId: String(uuidv7()),
      },
    });

    return tx.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
      include: { patient: true, schedule: true },
    });
  });
};

// refactoring on include of doctor and patient data in appointment details, we can use query builder to get the data in single query instead of multiple queries in case of doctor and patient both
const getMySingleAppointment = async (
  appointmentId: string,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUnique({
    where: {
      email: user?.email,
    },
  });

  const doctorData = await prisma.doctor.findUnique({
    where: {
      email: user?.email,
    },
  });

  let appointment;

  if (patientData) {
    appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  } else if (doctorData) {
    appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  }

  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  return appointment;
};

// integrate query builder
const getAllAppointments = async () => {
  const appointments = await prisma.appointment.findMany({
    include: {
      doctor: true,
      patient: true,
      schedule: true,
    },
  });
  return appointments;
};

const bookAppointmentWithPayLater = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  if (!payload.scheduleId) {
    throw new AppError(
      status.BAD_REQUEST,
      "A schedule is required for pay-later bookings",
    );
  }
  const scheduleId = payload.scheduleId;

  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: scheduleId,
    },
  });

  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
      },
    },
  });

  const videoCallingId = String(uuidv7());

  const result = await prisma.$transaction(async (tx) => {
    const appointmentData = await tx.appointment.create({
      data: {
        doctorId: payload.doctorId,
        patientId: patientData.id,
        scheduleId: doctorSchedule.scheduleId,
        videoCallingId,
      },
    });

    await tx.doctorSchedules.update({
      where: {
        doctorId_scheduleId: {
          doctorId: payload.doctorId,
          scheduleId,
        },
      },
      data: {
        isBooked: true,
      },
    });

    const transactionId = String(uuidv7());

    const paymentData = await tx.payment.create({
      data: {
        appointmentId: appointmentData.id,
        amount: doctorData.appointmentFee,
        transactionId,
      },
    });

    return {
      appointment: appointmentData,
      payment: paymentData,
    };
  });

  return result;
};

const initiatePayment = async (appointmentId: string, user: IRequestUser) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
      patientId: patientData.id,
    },
    include: {
      doctor: true,
      payment: true,
    },
  });

  if (!appointmentData) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  if (appointmentData.status === AppointmentStatus.CANCELED) {
    throw new AppError(status.BAD_REQUEST, "Appointment is canceled");
  }

  const paymentData =
    appointmentData.payment ??
    (await prisma.payment.upsert({
      where: { appointmentId: appointmentData.id },
      create: {
        appointmentId: appointmentData.id,
        amount: appointmentData.doctor.appointmentFee,
        transactionId: String(uuidv7()),
      },
      update: {},
    }));

  if (paymentData.status === PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      "Payment already completed for this appointment",
    );
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Appointment with Dr. ${appointmentData.doctor.name}`,
          },
          unit_amount: appointmentData.doctor.appointmentFee * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId: appointmentData.id,
      paymentId: paymentData.id,
    },

    success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${paymentData.id}&session_id={CHECKOUT_SESSION_ID}`,

    // cancel_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-failed`,
    cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`,
  });

  await prisma.payment.update({
    where: { id: paymentData.id },
    data: {
      paymentGatewayData: { checkoutSessionId: session.id },
    },
  });

  return {
    paymentUrl: session.url,
  };
};

const getAppointmentPaymentStatus = async (
  appointmentId: string,
  user: IRequestUser,
  checkoutSessionId?: string,
) => {
  const patient = await prisma.patient.findUniqueOrThrow({
    where: { email: user.email },
  });
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId: patient.id,
    },
    include: { payment: true },
  });

  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  if (appointment.paymentStatus === PaymentStatus.PAID) {
    return { paymentStatus: PaymentStatus.PAID };
  }

  const storedGatewayData = appointment.payment?.paymentGatewayData;
  let storedSessionId: string | undefined;
  if (storedGatewayData && typeof storedGatewayData === "object") {
    if (
      "checkoutSessionId" in storedGatewayData &&
      typeof storedGatewayData.checkoutSessionId === "string"
    ) {
      storedSessionId = storedGatewayData.checkoutSessionId;
    } else if (
      "id" in storedGatewayData &&
      typeof storedGatewayData.id === "string"
    ) {
      storedSessionId = storedGatewayData.id;
    }
  }
  const sessionId = checkoutSessionId ?? storedSessionId;
  if (!sessionId || !appointment.payment) {
    return { paymentStatus: appointment.paymentStatus };
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (
    session.metadata?.appointmentId !== appointment.id ||
    session.metadata?.paymentId !== appointment.payment.id
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      "Checkout session does not match this appointment",
    );
  }

  if (session.payment_status !== "paid") {
    return { paymentStatus: appointment.paymentStatus };
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointment.id },
      data: { paymentStatus: PaymentStatus.PAID },
    });
    if (appointment.payment) {
      await tx.payment.update({
        where: { id: appointment.payment.id },
        data: { status: PaymentStatus.PAID },
      });
    }
  });

  return { paymentStatus: PaymentStatus.PAID };
};

const cancelUnpaidAppointments = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const unpaidAppointments = await prisma.appointment.findMany({
    where: {
      status: {
        not: AppointmentStatus.REQUESTED,
      },
      updatedAt: {
        lte: thirtyMinutesAgo,
      },
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  const appointmentToCancel = unpaidAppointments.map(
    (appointment) => appointment.id,
  );

  await prisma.$transaction(async (tx) => {
    await tx.appointment.updateMany({
      where: {
        id: {
          in: appointmentToCancel,
        },
      },
      data: {
        status: AppointmentStatus.CANCELED,
      },
    });

    await tx.payment.deleteMany({
      where: {
        appointmentId: {
          in: appointmentToCancel,
        },
      },
    });

    for (const unpaidAppointment of unpaidAppointments) {
      if (unpaidAppointment.scheduleId) {
        await tx.doctorSchedules.update({
          where: {
            doctorId_scheduleId: {
              doctorId: unpaidAppointment.doctorId,
              scheduleId: unpaidAppointment.scheduleId,
            },
          },
          data: {
            isBooked: false,
          },
        });
      }
    }
  });
};

export const AppointmentService = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  scheduleAppointmentRequest,
  getMySingleAppointment,
  getAllAppointments,
  bookAppointmentWithPayLater,
  initiatePayment,
  getAppointmentPaymentStatus,
  cancelUnpaidAppointments,
};
