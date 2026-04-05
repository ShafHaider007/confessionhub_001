import { z } from "zod";

export const verifySchema = z.object({
    code: z.string().min(6, { message: "Verify code must be 6 characters long" }),
});
