import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PatientService } from "./patient.service";

const createPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await PatientService.createPatient(req.body);

  sendResponse(res, {
    htttpStatusCode: status.CREATED,
    success: true,
    message: "Patient created successfully",
    data: result,
  });
});

const getAllPatients = catchAsync(async (_req: Request, res: Response) => {
  const result = await PatientService.getAllPatients();

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "Patients fetched successfully",
    data: result,
  });
});

const getPatientById = catchAsync(async (req: Request, res: Response) => {
  const result = await PatientService.getPatientById(req.params.id as string);

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "Patient fetched successfully",
    data: result,
  });
});

const updatePatient = catchAsync(async (req: Request, res: Response) => {
  const result = await PatientService.updatePatient(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "Patient updated successfully",
    data: result,
  });
});

const deletePatient = catchAsync(async (req: Request, res: Response) => {
  const result = await PatientService.deletePatient(req.params.id as string);

  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "Patient deleted successfully",
    data: result,
  });
});

export const PatientController = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};
