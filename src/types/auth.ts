import { z } from "zod";

export const registerSchema = z.object({
  userId: z
    .string()
    .min(3, "User ID must be at least 3 characters")
    .max(20, "User ID must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "User ID can only contain letters, numbers, hyphens and underscores"),
  
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username must be at most 30 characters"),
  
  email: z
    .string()
    .email("Invalid email address"),
  
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  
  confirmPassword: z
    .string()
    .min(8, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address"),
  
  password: z
    .string()
    .min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
