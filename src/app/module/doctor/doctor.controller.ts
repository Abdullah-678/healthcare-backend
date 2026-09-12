import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { doctorServices } from "./doctor.service";
import status from "http-status";

const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  const result = await doctorServices.getAllDoctors();
  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "doctors fetched successfully",
    data: result,
  });
});

const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await doctorServices.getDoctorById(id as string);
  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "doctor fetched successfully",
    data: result,
  });
});

const deleteDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await doctorServices.deleteDoctor(id as string);
  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "doctor deleted successfully",
    data: result,
  });
});
const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await doctorServices.updateDoctor(id as string, payload);
  sendResponse(res, {
    htttpStatusCode: status.OK,
    success: true,
    message: "specialty updated successfully",
    data: result,
  });
});

export const doctorsControllers = {
  getAllDoctors,
  getDoctorById,
  deleteDoctor,
  updateDoctor,
};
