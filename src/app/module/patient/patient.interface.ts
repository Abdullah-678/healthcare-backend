export interface ICreatePatientPayload {
  password: string;
  patient: {
    name: string;
    email: string;
    profilePhoto?: string;
    contactNumber?: string;
    address?: string;
  };
}

export interface IUpdatePatientPayload {
  patient?: {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
    address?: string;
  };
}
