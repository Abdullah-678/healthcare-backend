import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { userServices } from "./user.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await userServices.createDoctor(payload);
  sendResponse(res, {
    htttpStatusCode: status.CREATED,
    success: true,
    message: "doctor registered successfully",
    data: result,
  });
});

export const userController = {
  createDoctor,
};
