import z from "zod";
import { Gender } from "../../generated/prisma/enums";

export const createDoctorValidationSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),

  doctor: z.object({
    name: z.string().min(1, "Name is required"),

    email: z.email("Invalid email address"),

    profilePhoto: z.string("Invalid profile photo URL").optional(),

    contactNumber: z.string().optional(),

    address: z.string().optional(),

    registrationNumber: z.string().min(1, "Registration number is required"),

    experience: z
      .number()
      .int()
      .min(0, "Experience cannot be negative")
      .optional(),

    gender: z.enum(Gender),

    appointmentFee: z.number().min(0, "Appointment fee cannot be negative"),

    qualification: z.string().min(1, "Qualification is required"),

    currentWorkingPlace: z.string().min(1, "Current working place is required"),

    designation: z.string().min(1, "Designation is required"),
  }),

  specialties: z.array(z.string()).min(1, "At least one specialty is required"),
});
