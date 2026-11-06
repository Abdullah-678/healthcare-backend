import z from "zod";

export const createPatientSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  patient: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    profilePhoto: z.string().optional(),
    contactNumber: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const updatePatientSchema = z.object({
  patient: z
    .object({
      name: z.string().min(1, "Name is required").optional(),
      profilePhoto: z.string().optional(),
      contactNumber: z.string().optional(),
      address: z.string().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one patient field must be provided",
    }),
});
