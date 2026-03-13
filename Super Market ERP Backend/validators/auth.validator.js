import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(30)
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/,
      "Password must contain  capital & simple letters, numbers, symbols and must be 6-30 characters long",
    ),

  fullName: z.string().min(1).max(100).optional(),

  userRole: z.enum(["Admin", "Manager", "Staff"]).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const updateProfileSchema = z
  .object({
    username: z.string().min(3).max(30).optional(),
    fullName: z.string().min(1).optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(30)
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/,
        "Password must contain  capital & simple letters, numbers, symbols and must be 6-30 characters long",
      )
      .optional(),
  })
  .refine((data) => data.username || data.fullName || data.password, {
    message: "At least one field must be provided",
  });

export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a positive integer")
    .transform(Number),
});

export default {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  idParamSchema,
};
