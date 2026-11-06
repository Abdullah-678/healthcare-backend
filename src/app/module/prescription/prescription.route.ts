import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PrescriptionController } from "./prescription.controller";
import { PrescriptionValidation } from "./prescription.validation";

const router = Router();
const adminRoles = [Role.ADMIN, Role.SUPERADMIN] as const;

router.post(
  "/create-prescription",
  checkAuth(Role.DOCTOR),
  validateRequest(PrescriptionValidation.createPrescriptionZodSchema),
  PrescriptionController.createPrescription,
);
router.get(
  "/all-prescriptions",
  checkAuth(...adminRoles),
  PrescriptionController.getAllPrescriptions,
);

export const PrescriptionRoutes = router;
