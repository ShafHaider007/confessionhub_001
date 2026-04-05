import { z } from "zod";

export const signInSchema = z.object({
    email: z.string().regex(/^\S+@\S+\.\S+$/, { message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

export type SignInSchema = z.infer<typeof signInSchema>;