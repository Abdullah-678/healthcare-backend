import { Request, Response } from "express";
import status from "http-status";
import { AppError } from "../../errorHelpers/appError";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { ICreatePrescriptionPayload } from "./prescription.interface";
import { PrescriptionService } from "./prescription.service";

const createPrescription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Unauthorized access");
  }

  const result = await PrescriptionService.createPrescription(
    user,
    req.body as ICreatePrescriptionPayload,
  );

  sendResponse(res, {
    htttpStatusCode: status.CREATED,
    success: true,
    message: "Prescription created successfully",
    data: result,
  });
});

const getAllPrescriptions = catchAsync(async (_req: Request, res: Response) => {
  const result = await PrescriptionService.getAllPrescriptions();

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "Prescriptions retrieved successfully",
    data: result,
  });
});

export const PrescriptionController = {
  createPrescription,
  getAllPrescriptions,
};
