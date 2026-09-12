import { Router } from "express";
import { specialtyController } from "./specialty.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();
router.post("/", specialtyController.createSpecialty);
router.get("/", checkAuth(Role.PATIENT), specialtyController.getSpecialties);
router.get("/:id", specialtyController.getSpecialtyById);
router.delete("/:id", specialtyController.deleteSpecialty);
router.put("/:id", specialtyController.updateSpecialty);

export const specialtyRoutes = router;
