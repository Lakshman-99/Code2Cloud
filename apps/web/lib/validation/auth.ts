import { z } from "zod";

export const signInSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export const signUpSchema = signInSchema.extend({
  name: z.string().min(2, { message: "Full name must be at least 2 characters" }),
});

export type SignInSchema = z.infer<typeof signInSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
