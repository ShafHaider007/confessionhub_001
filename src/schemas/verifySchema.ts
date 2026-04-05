import { z } from "zod";

import { emailValidation } from "./signUpSchema";

/** Normalizes pasted verification codes (trim, remove spaces, lowercase hex). */
export function normalizeVerifyCode(code: string): string {
    return code.trim().replace(/\s/g, "").toLowerCase();
}

/**
 * Email + verification code from `randomBytes(32).toString("hex")` (64 hex chars).
 */
export const verifyEmailSchema = z
    .object({
        email: emailValidation,
        code: z.string(),
    })
    .superRefine((data, ctx) => {
        const c = normalizeVerifyCode(data.code);
        if (!/^[a-f0-9]{64}$/.test(c)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Paste the full verification code from your email (64 characters).",
                path: ["code"],
            });
        }
    });

/** @deprecated Prefer `verifyEmailSchema` — kept for docs/tooling parity. */
export const verifySchema = verifyEmailSchema;
