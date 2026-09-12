import { Request, Response } from "express";
import { specialtyServices } from "./specialty.service";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";

const createSpecialty = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await specialtyServices.createSpecialty(payload);
  sendResponse(res, {
    htttpStatusCode: 201,
    success: true,
    message: "specialty created successfully",
    data: result,
  });
});
const getSpecialties = catchAsync(async (req: Request, res: Response) => {
  const result = await specialtyServices.getSpecialties();
  sendResponse(res, {
    htttpStatusCode: 200,
    success: true,
    message: "specialties fetched successfully",
    data: result,
  });
});

const getSpecialtyById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await specialtyServices.getSpecialtyById(id as string);
  sendResponse(res, {
    htttpStatusCode: 200,
    success: true,
    message: "specialty fetched successfully",
    data: result,
  });
});
const deleteSpecialty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await specialtyServices.deleteSpecialty(id as string);
  sendResponse(res, {
    htttpStatusCode: 200,
    success: true,
    message: "specialty deleted successfully",
    data: result,
  });
});
const updateSpecialty = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await specialtyServices.updateSpecialty(id as string, payload);
  sendResponse(res, {
    htttpStatusCode: 200,
    success: true,
    message: "specialty updated successfully",
    data: result,
  });
});

export const specialtyController = {
  createSpecialty,
  getSpecialties,
  getSpecialtyById,
  deleteSpecialty,
  updateSpecialty,
};
