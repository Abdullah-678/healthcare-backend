import z from "zod";

const createPrescriptionZodSchema = z.object({
  appointmentId: z.string().min(1),
  followUpDate: z.coerce.date(),
  instructions: z.string().trim().min(1),
});

export const PrescriptionValidation = {
  createPrescriptionZodSchema,
};
