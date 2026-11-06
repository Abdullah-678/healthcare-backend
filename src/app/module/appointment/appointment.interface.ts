import type { AppointmentStatus } from "../../../generated/prisma/enums";

export interface IBookAppointmentPayload {
  doctorId: string;
  scheduleId?: string;
}

export interface IUpdateAppointmentPayload {
  doctorId?: string;
  scheduleId?: string;
  status?: string;
}

export interface IChangeAppointmentStatusPayload {
  status: AppointmentStatus;
}

export interface IScheduleAppointmentRequestPayload {
  scheduleId: string;
}
