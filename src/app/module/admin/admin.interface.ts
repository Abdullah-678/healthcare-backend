export interface IUpdateAdminPayload {
  admin?: {
    name?: string;
    profilePhoto?: string;
    contactNumber?: string;
  };
}

export interface ICreateAdminPayload {
  password: string;
  admin: {
    name: string;
    email: string;
    profilePhoto?: string;
    contactNumber?: string;
  };
}
