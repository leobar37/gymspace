import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(18, "Must be at least 18 years old").optional(),
  bio: z.string().max(200, "Bio must be less than 200 characters").optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;