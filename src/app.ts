import express, { Application, Request, Response } from "express";
import { IndexRoutes } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import path from "path";
import cors from "cors";
import { envVars } from "./config/env";
import { PaymentController } from "./app/module/payment/payment.controller";
import cron from "node-cron";
import { AppointmentService } from "./app/module/appointment/appointment.service";
import { timingSafeEqual } from "node:crypto";

export const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));
app.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  PaymentController.handleStripeWebhookEvent,
);
app.use(
  cors({
    origin: [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/auth", toNodeHandler(auth));

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

if (process.env.VERCEL !== "1") {
  cron.schedule("*/25 * * * *", async () => {
    try {
      console.log("Running cron job to cancel unpaid appointments...");
      await AppointmentService.cancelUnpaidAppointments();
    } catch (error) {
      console.error("Error occurred while canceling unpaid appointments:", error);
    }
  });
}

app.use("/api/v1/", IndexRoutes);

app.get(
  "/api/v1/maintenance/cancel-unpaid-appointments",
  async (req: Request, res: Response, next) => {
    res.set("Cache-Control", "no-store");
    const cronSecret = envVars.CRON_SECRET;
    const authorization = req.get("authorization");
    const providedSecret = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";

    if (!cronSecret) {
      res.status(503).json({
        success: false,
        message: "Scheduled maintenance is not configured",
      });
      return;
    }

    const expected = Buffer.from(cronSecret);
    const provided = Buffer.from(providedSecret);
    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    try {
      await AppointmentService.cancelUnpaidAppointments();
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
