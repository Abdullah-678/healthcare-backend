import { Request, Response } from "express";
import status from "http-status";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { DoctorScheduleService } from "./doctorSchedule.service";
import { AppError } from "../../errorHelpers/appError";

const createMyDoctorSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
    }
    const doctorSchedule = await DoctorScheduleService.createMyDoctorSchedule(
      user,
      payload,
    );
    sendResponse(res, {
      success: true,
      htttpStatusCode: status.CREATED,
      message: "Doctor schedule created successfully",
      data: doctorSchedule,
    });
  },
);

const getMyDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }
  const result = await DoctorScheduleService.getMyDoctorSchedules(user);
  sendResponse(res, {
    success: true,
    htttpStatusCode: status.OK,
    message: "Doctor schedules retrieved successfully",
    data: result,
  });
});

const getAllDoctorSchedules = catchAsync(
  async (req: Request, res: Response) => {
    const result = await DoctorScheduleService.getAllDoctorSchedules();
    sendResponse(res, {
      success: true,
      htttpStatusCode: status.OK,
      message: "All doctor schedules retrieved successfully",
      data: result,
    });
  },
);

const getDoctorScheduleById = catchAsync(
  async (req: Request, res: Response) => {
    const doctorId = req.params.doctorId;
    const scheduleId = req.params.scheduleId;
    const doctorSchedule = await DoctorScheduleService.getDoctorScheduleById(
      doctorId as string,
      scheduleId as string,
    );
    sendResponse(res, {
      success: true,
      htttpStatusCode: status.OK,
      message: "Doctor schedule retrieved successfully",
      data: doctorSchedule,
    });
  },
);

const updateMyDoctorSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;
    const user = req.user;
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
    }
    const updatedDoctorSchedule =
      await DoctorScheduleService.updateMyDoctorSchedule(user, payload);
    sendResponse(res, {
      success: true,
      htttpStatusCode: status.OK,
      message: "Doctor schedule updated successfully",
      data: updatedDoctorSchedule,
    });
  },
);

const deleteMyDoctorSchedule = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const user = req.user;
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
    }
    await DoctorScheduleService.deleteMyDoctorSchedule(id as string, user);
    sendResponse(res, {
      success: true,
      htttpStatusCode: status.OK,
      message: "Doctor schedule deleted successfully",
    });
  },
);

export const DoctorScheduleController = {
  createMyDoctorSchedule,
  getMyDoctorSchedules,
  getAllDoctorSchedules,
  getDoctorScheduleById,
  updateMyDoctorSchedule,
  deleteMyDoctorSchedule,
};
