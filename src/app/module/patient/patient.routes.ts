import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PatientController } from "./patient.controller";
import {
  createPatientSchema,
  updatePatientSchema,
} from "./patient.validation";

const router = Router();
const adminRoles = [Role.ADMIN, Role.SUPERADMIN] as const;

router.post(
  "/",
  checkAuth(...adminRoles),
  validateRequest(createPatientSchema),
  PatientController.createPatient,
);
router.get("/", checkAuth(...adminRoles), PatientController.getAllPatients);
router.get("/:id", checkAuth(...adminRoles), PatientController.getPatientById);
router.patch(
  "/:id",
  checkAuth(...adminRoles),
  validateRequest(updatePatientSchema),
  PatientController.updatePatient,
);
router.delete("/:id", checkAuth(...adminRoles), PatientController.deletePatient);

export const PatientRoutes = router;
