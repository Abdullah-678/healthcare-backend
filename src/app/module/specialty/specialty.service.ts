import { Specialty } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const createSpecialty = async (payload: Specialty): Promise<Specialty> => {
  const specialty = await prisma.specialty.create({
    data: payload,
  });
  return specialty;
};

const getSpecialties = async (): Promise<Specialty[]> => {
  const specialty = await prisma.specialty.findMany();
  return specialty;
};

const getSpecialtyById = async (id: string) => {
  const specialty = await prisma.specialty.findUnique({
    where: {
      id,
    },
  });
  return specialty;
};
const deleteSpecialty = async (id: string) => {
  const specialty = await prisma.specialty.delete({
    where: {
      id,
    },
  });
  return specialty;
};

const updateSpecialty = async (id: string, data: Specialty) => {
  const { title, description, icon } = data;

  const specialty = await prisma.specialty.update({
    where: {
      id,
    },
    data: {
      title,
      description,
      icon,
    },
  });
  return specialty;
};

export const specialtyServices = {
  createSpecialty,
  getSpecialties,
  getSpecialtyById,
  deleteSpecialty,
  updateSpecialty,
};
