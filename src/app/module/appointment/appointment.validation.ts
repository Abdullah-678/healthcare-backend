import z from "zod";

const changeAppointmentStatusZodSchema = z.object({
  status: z.enum(["SCHEDULED", "INPROGRESS", "COMPLETED", "CANCELED"]),
});

const scheduleAppointmentRequestZodSchema = z.object({
  scheduleId: z.string().min(1),
});

export const AppointmentValidation = {
  changeAppointmentStatusZodSchema,
  scheduleAppointmentRequestZodSchema,
};
