import { Doctor } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const getAllDoctors = async () => {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
      specialties: {
        include: {
          specialty: true,
          specialties: true,
          appointments: true,
          reviews: true,
          prescriptions: true,
        },
      },
    },
  });
  return doctors;
};

const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id,
    },
  });
  return doctor;
};

const deleteDoctor = async (id: string) => {
  const deleteDoctor = await prisma.doctor.delete({
    where: {
      id,
    },
  });
  return deleteDoctor;
};

const updateDoctor = async (id: string, payload: Doctor) => {
  const {
    name,
    email,
    profilePhoto,
    contactNumber,
    address,
    appointmentFee,
    currentWorkingPlace,
  } = payload;

  const updateDoctor = await prisma.doctor.update({
    where: {
      id,
    },
    data: {
      name,
      email,
      profilePhoto,
      contactNumber,
      address,
      appointmentFee,
      currentWorkingPlace,
    },
  });
  return updateDoctor;
};

export const doctorServices = {
  getAllDoctors,
  getDoctorById,
  deleteDoctor,
  updateDoctor,
};
