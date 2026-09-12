import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { ScheduleController } from "./schedule.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { ScheduleValidation } from "./schedule.validation";

const router = Router();

router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPERADMIN),
  validateRequest(ScheduleValidation.createScheduleZodSchema),
  ScheduleController.createSchedule,
);
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPERADMIN, Role.DOCTOR),
  ScheduleController.getAllSchedules,
);
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPERADMIN, Role.DOCTOR),
  ScheduleController.getScheduleById,
);
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPERADMIN),
  validateRequest(ScheduleValidation.updateScheduleZodSchema),
  ScheduleController.updateSchedule,
);
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPERADMIN),
  ScheduleController.deleteSchedule,
);

export const scheduleRoutes = router;
