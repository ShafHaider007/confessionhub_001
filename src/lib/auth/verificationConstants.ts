/** How long a verification code stays valid (must match sign-up / resend logic). */
export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

export const VERIFICATION_CODE_TTL_MINUTES = VERIFICATION_CODE_TTL_MS / 60_000;
