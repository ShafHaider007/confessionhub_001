import { z } from "zod";

import { emailValidation } from "./signUpSchema";

export const resendVerificationSchema = z.object({
    email: emailValidation,
});
