import { NextFunction, Request, Response, Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createDoctorValidationSchema } from "../../middleware/createDoctorZodSchema";

const router = Router();
router.post(
  "/create-doctor",
  validateRequest(createDoctorValidationSchema),
  userController.createDoctor,
);
export const userRoutes = router;
