ALTER TYPE "AppointmentStatus" ADD VALUE 'REQUESTED';

ALTER TABLE "appointments"
ALTER COLUMN "scheduleId" DROP NOT NULL;
