import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AppointmentService } from "./appointment.service";
import { AppError } from "../../errorHelpers/appError";
import type {
  IChangeAppointmentStatusPayload,
  IScheduleAppointmentRequestPayload,
} from "./appointment.interface";

const bookAppointment = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }
  const appointment = await AppointmentService.bookAppointment(payload, user);
  sendResponse(res, {
    success: true,
    htttpStatusCode: status.CREATED,
    message: "Appointment booked successfully",
    data: appointment,
  });
});

const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }
  const appointments = await AppointmentService.getMyAppointments(user);
  sendResponse(res, {
    success: true,
    htttpStatusCode: status.OK,
    message: "Appointments retrieved successfully",
    data: appointments,
  });
});

const changeAppointmentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const payload = req.body as IChangeAppointmentStatusPayload;
    const user = req.user;
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
    }
    const updatedAppointment = await AppointmentService.changeAppointmentStatus(
      appointmentId as string,
      payload.status,
      user,
    );
    sendResponse(res, {
      success: true,
      htttpStatusCode: status.OK,
      message: "Appointment status updated successfully",
      data: updatedAppointment,
    });
  },
);

const scheduleAppointmentRequest = catchAsync(
  async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const payload = req.body as IScheduleAppointmentRequestPayload;
    const user = req.user;
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
    }

    const appointment = await AppointmentService.scheduleAppointmentRequest(
      appointmentId as string,
      payload.scheduleId,
      user,
    );
    sendResponse(res, {
      success: true,
      htttpStatusCode: status.OK,
      message: "Appointment request scheduled successfully",
      data: appointment,
    });
  },
);

const getMySingleAppointment = catchAsync(
  async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const user = req.user;
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
    }
    const appointment = await AppointmentService.getMySingleAppointment(
      appointmentId as string,
      user,
    );
    sendResponse(res, {
      success: true,
      htttpStatusCode: status.OK,
      message: "Appointment retrieved successfully",
      data: appointment,
    });
  },
);

const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
  const appointments = await AppointmentService.getAllAppointments();
  sendResponse(res, {
    success: true,
    htttpStatusCode: status.OK,
    message: "All appointments retrieved successfully",
    data: appointments,
  });
});

const bookAppointmentWithPayLater = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
    }
    const appointment = await AppointmentService.bookAppointmentWithPayLater(
      payload,
      user,
    );
    sendResponse(res, {
      success: true,
      htttpStatusCode: status.CREATED,
      message: "Appointment booked successfully with Pay Later option",
      data: appointment,
    });
  },
);

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const appointmentId = req.params.id;
  const user = req.user;
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }
  const paymentInfo = await AppointmentService.initiatePayment(
    appointmentId as string,
    user,
  );

  sendResponse(res, {
    success: true,
    htttpStatusCode: status.OK,
    message: "Payment initiated successfully",
    data: paymentInfo,
  });
});

const getAppointmentPaymentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const appointmentId = req.params.id;
    const user = req.user;
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
    }

    const paymentStatus =
      await AppointmentService.getAppointmentPaymentStatus(
        appointmentId as string,
        user,
        typeof req.query.session_id === "string"
          ? req.query.session_id
          : undefined,
      );

    sendResponse(res, {
      success: true,
      htttpStatusCode: status.OK,
      message: "Appointment payment status retrieved successfully",
      data: paymentStatus,
    });
  },
);

export const AppointmentController = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  scheduleAppointmentRequest,
  getMySingleAppointment,
  getAllAppointments,
  bookAppointmentWithPayLater,
  initiatePayment,
  getAppointmentPaymentStatus,
};
