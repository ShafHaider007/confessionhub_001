import { z } from "zod";

//boolean value to accept or reject the message
export const AcceptMessageSchema = z.object({
    accept: z.boolean(),
});

export type AcceptMessageSchema = z.infer<typeof AcceptMessageSchema>;