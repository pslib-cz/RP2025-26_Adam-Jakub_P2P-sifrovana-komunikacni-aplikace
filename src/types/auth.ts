import { z } from "zod";

export const registerSchema = z.object({
  userId: z
    .string()
    .min(3, "ID uživatele musí mít alespoň 3 znaky")
    .max(15, "ID uživatele může mít maximálně 15 znaků")
    .regex(/^[a-zA-Z0-9_-]+$/, "ID uživatele může obsahovat pouze písmena, čísla, pomlčky a podtržítka"),

  username: z
    .string()
    .min(2, "Uživatelské jméno musí mít alespoň 2 znaky")
    .max(15, "Uživatelské jméno může mít maximálně 15 znaků"),

  email: z
    .string()
    .email("Neplatná e-mailová adresa"),

  password: z
    .string()
    .min(8, "Heslo musí mít alespoň 8 znaků")
    .regex(/[A-Z]/, "Heslo musí obsahovat alespoň jedno velké písmeno")
    .regex(/[a-z]/, "Heslo musí obsahovat alespoň jedno malé písmeno")
    .regex(/[0-9]/, "Heslo musí obsahovat alespoň jedno číslo"),

  confirmPassword: z
    .string()
    .min(8, "Potvrzení hesla je povinné"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hesla se neshodují",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Neplatná e-mailová adresa"),

  password: z
    .string()
    .min(1, "Heslo je povinné"),
});

export const profileSchema = z.object({
  username: z
    .string()
    .min(2, "Jméno musí mít alespoň 2 znaky")
    .max(15, "Jméno může mít maximálně 15 znaků"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
