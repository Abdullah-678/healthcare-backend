import z from "zod";

export const updateAdminZodSchema = z.object({
  admin: z
    .object({
      name: z.string("Name must be a string").optional(),
      profilePhoto: z.url("Profile photo must be a valid URL").optional(),
      contactNumber: z
        .string("Contact number must be a string")
        .min(11, "Contact number must be at least 11 characters")
        .max(14, "Contact number must be at most 15 characters")
        .optional(),
    })
    .optional(),
});

export const createAdminZodSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  admin: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    profilePhoto: z.url("Profile photo must be a valid URL").optional(),
    contactNumber: z.string().optional(),
  }),
});
