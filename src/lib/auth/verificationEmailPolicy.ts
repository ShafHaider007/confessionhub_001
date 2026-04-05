const WINDOW_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_EMAILS_PER_24H = 5;

export type VerificationEmailTracking = {
    lastVerificationEmailAt?: Date | null;
    verificationEmailWindowStart?: Date | null;
    verificationEmailWindowCount?: number;
};

export function assertCanSendVerificationEmail(
    prev: VerificationEmailTracking,
): { ok: true } | { ok: false; message: string; status: number } {
    const now = Date.now();
    const last = prev.lastVerificationEmailAt
        ? new Date(prev.lastVerificationEmailAt).getTime()
        : 0;
    if (last && now - last < COOLDOWN_MS) {
        const waitSec = Math.max(1, Math.ceil((COOLDOWN_MS - (now - last)) / 1000));
        return {
            ok: false,
            message: `Please wait ${waitSec}s before requesting another verification email.`,
            status: 429,
        };
    }

    const ws = prev.verificationEmailWindowStart
        ? new Date(prev.verificationEmailWindowStart).getTime()
        : 0;
    let effectiveCount = prev.verificationEmailWindowCount ?? 0;
    if (!ws || now - ws > WINDOW_MS) {
        effectiveCount = 0;
    }
    if (effectiveCount >= MAX_EMAILS_PER_24H) {
        return {
            ok: false,
            message:
                "Too many verification emails in the last 24 hours. Try again later.",
            status: 429,
        };
    }
    return { ok: true };
}

export function nextVerificationEmailTracking(prev: VerificationEmailTracking): {
    lastVerificationEmailAt: Date;
    verificationEmailWindowStart: Date;
    verificationEmailWindowCount: number;
} {
    const now = new Date();
    const nowMs = now.getTime();
    const ws = prev.verificationEmailWindowStart
        ? new Date(prev.verificationEmailWindowStart).getTime()
        : 0;
    const count = prev.verificationEmailWindowCount ?? 0;
    if (!ws || nowMs - ws > WINDOW_MS) {
        return {
            lastVerificationEmailAt: now,
            verificationEmailWindowStart: now,
            verificationEmailWindowCount: 1,
        };
    }
    return {
        lastVerificationEmailAt: now,
        verificationEmailWindowStart: new Date(ws),
        verificationEmailWindowCount: count + 1,
    };
}
