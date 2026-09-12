import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { updateAdminZodSchema } from "./admin.validation";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPERADMIN),
  AdminController.getAllAdmins,
);
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPERADMIN),
  AdminController.getAdminById,
);
router.patch(
  "/:id",
  checkAuth(Role.SUPERADMIN),
  validateRequest(updateAdminZodSchema),
  AdminController.updateAdmin,
);
router.delete("/:id", checkAuth(Role.SUPERADMIN), AdminController.deleteAdmin);

export const AdminRoutes = router;
