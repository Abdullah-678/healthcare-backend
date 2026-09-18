import express from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { ReviewController } from "./review.controller";

const router = express.Router();

router.get("/", ReviewController.getAllReviews);

router.post("/", checkAuth(Role.PATIENT), ReviewController.giveReview);

router.get(
  "/my-reviews",
  checkAuth(Role.PATIENT, Role.DOCTOR),
  ReviewController.myReviews,
);

router.patch("/:id", checkAuth(Role.PATIENT), ReviewController.updateReview);

router.delete("/:id", checkAuth(Role.PATIENT), ReviewController.deleteReview);

export const ReviewRoutes = router;
