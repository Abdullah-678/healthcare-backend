import { Router } from "express";
import { doctorsControllers } from "./doctor.controller";

const router = Router();
router.get("/", doctorsControllers.getAllDoctors);
router.get("/:id", doctorsControllers.getDoctorById);
router.put("/:id", doctorsControllers.updateDoctor);
router.delete("/:id", doctorsControllers.deleteDoctor);
export const doctorRoutes = router;
