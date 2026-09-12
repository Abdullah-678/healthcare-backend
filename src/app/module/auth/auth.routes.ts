import { Router } from "express";
import { authControllers } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();
router.post("/register", authControllers.registerPatient);
router.post("/login", authControllers.loginUser);
router.get(
  "/me",
  checkAuth(Role.ADMIN, Role.DOCTOR, Role.SUPERADMIN, Role.PATIENT),
  authControllers.getMe,
);
router.post("/refresh-token", authControllers.getNewToken);
router.post("/change-password", authControllers.changePassword);
router.post(
  "/logout",
  checkAuth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPERADMIN),
  authControllers.logout,
);
router.post("/verify-email", authControllers.verifyEmail);
router.post("/forget-password", authControllers.forgetPassword);
router.post("/reset-password", authControllers.resetPassword);
router.get("/login/google", authControllers.googleLogin);
router.get("/google/success", authControllers.googleLoginSuccess);
router.get("/oauth/error", authControllers.handleOAuthError);
export const authRoutes = router;
