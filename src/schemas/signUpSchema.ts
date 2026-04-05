import { z } from "zod";

export const usernameValidation = z
                                .string()
                                .min(3, { message: "Username must be at least 3 characters long" })
                                .max(20, { message: "Username must be at most 20 characters long" })
                                .regex(/^[a-zA-Z0-9]+$/, { message: "Username must contain only letters and numbers" });


export const passwordValidation = z
                                .string()
                                .min(8, { message: "Password must be at least 8 characters long" })
                                .max(20, { message: "Password must be at most 20 characters long" })
                                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { message: "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character" });

export const emailValidation = z
                                .string()
                                .regex(/^\S+@\S+\.\S+$/, { message: "Invalid email address" });

export const signUpSchema = z.object({
    username: usernameValidation,
    password: passwordValidation,
    email: emailValidation,
});