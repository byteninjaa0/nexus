import { z } from "zod";

const password = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "One uppercase letter")
  .regex(/\d/, "One number")
  .regex(/[^A-Za-z0-9]/, "One special character");

export const loginSchema = z.object({
  email: z.string().email("Valid email"),
  password: z.string().min(1, "Required"),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name too short").max(80),
    email: z.string().email("Valid email"),
    password,
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const projectSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  color: z.string().optional(),
  icon: z.string().optional(),
  deadline: z.string().optional().nullable(),
  memberIds: z.array(z.string()).optional(),
});

export const taskSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});
