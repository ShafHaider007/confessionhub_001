"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { VERIFICATION_CODE_TTL_MINUTES } from "@/lib/auth/verificationConstants";
import { resendVerificationSchema } from "@/schemas/resendVerificationSchema";
import { verifyEmailSchema } from "@/schemas/verifySchema";
import type { ApiResponse } from "@/types/ApiResponse";

function navigateToSignInVerified() {
    window.location.assign(`${window.location.origin}/sign-in?verified=1`);
}

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [lastErrorCode, setLastErrorCode] = useState<string | undefined>();
    const [fieldErrors, setFieldErrors] = useState<{
        email?: string;
        code?: string;
    }>({});

    const [resendSubmitting, setResendSubmitting] = useState(false);
    const [resendInfo, setResendInfo] = useState<string | null>(null);
    const [resendError, setResendError] = useState<string | null>(null);

    useEffect(() => {
        const q = searchParams.get("email");
        if (q) setEmail(q);
    }, [searchParams]);

    useEffect(() => {
        if (status === "authenticated" && session) {
            router.replace("/");
        }
    }, [status, session, router]);

    async function handleResend() {
        setResendError(null);
        setResendInfo(null);
        const parsedEmail = resendVerificationSchema.safeParse({
            email: email.trim(),
        });
        if (!parsedEmail.success) {
            setResendError(
                parsedEmail.error.issues[0]?.message ??
                    "Enter a valid email above.",
            );
            return;
        }

        setResendSubmitting(true);
        try {
            const res = await fetch("/api/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: parsedEmail.data.email }),
            });
            const data = (await res.json()) as ApiResponse;

            if (!res.ok || !data.success) {
                setResendError(data.message ?? "Could not send email.");
                return;
            }
            setResendInfo(data.message);
            setCode("");
            setLastErrorCode(undefined);
            setFormError(null);
        } catch {
            setResendError("Something went wrong. Try again.");
        } finally {
            setResendSubmitting(false);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);
        setLastErrorCode(undefined);
        setFieldErrors({});

        const parsed = verifyEmailSchema.safeParse({ email, code });
        if (!parsed.success) {
            const flat = parsed.error.flatten().fieldErrors;
            setFieldErrors({
                email: flat.email?.[0],
                code: flat.code?.[0],
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: parsed.data.email,
                    code: parsed.data.code,
                }),
            });

            const data = (await res.json()) as ApiResponse;

            if (!res.ok || !data.success) {
                setFormError(data.message ?? "Verification failed.");
                setLastErrorCode(data.errorCode);
                return;
            }

            navigateToSignInVerified();
        } catch {
            setFormError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (status === "loading" || status === "authenticated") {
        return (
            <div className="flex min-h-[200px] items-center justify-center text-base font-light text-[var(--spatialx-text-muted)]">
                {status === "loading" ? "Loading…" : "Redirecting…"}
            </div>
        );
    }

    const showExpiredHint = lastErrorCode === "CODE_EXPIRED";

    return (
        <div className="flex flex-col gap-8">
            <p className="rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg-muted)] px-3 py-2.5 text-base font-light text-[var(--spatialx-text)]">
                Codes expire after{" "}
                <span className="font-medium">
                    {VERIFICATION_CODE_TTL_MINUTES} minutes
                </span>{" "}
                for security. If yours expired, use &quot;Email me a new
                code&quot; (same email) — subject to rate limits.
            </p>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
                noValidate
            >
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="verify-email"
                        className="text-base font-medium text-[var(--spatialx-text)]"
                    >
                        Email
                    </label>
                    <input
                        id="verify-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg-muted)] px-3 py-3 text-base text-[var(--spatialx-text)] outline-none ring-[var(--spatialx-green)]/25 transition focus:border-[var(--spatialx-green)] focus:ring-2"
                        disabled={submitting}
                        required
                    />
                    {fieldErrors.email ? (
                        <p
                            className="text-base text-red-600"
                            role="alert"
                        >
                            {fieldErrors.email}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="verify-code"
                        className="text-base font-medium text-[var(--spatialx-text)]"
                    >
                        Verification code
                    </label>
                    <textarea
                        id="verify-code"
                        name="code"
                        rows={3}
                        placeholder="Paste the code from your email"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="resize-y rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg-muted)] px-3 py-3 font-mono text-base text-[var(--spatialx-text)] outline-none ring-[var(--spatialx-green)]/25 transition focus:border-[var(--spatialx-green)] focus:ring-2"
                        disabled={submitting}
                        required
                        spellCheck={false}
                    />
                    <p className="text-base font-light text-[var(--spatialx-text-muted)]">
                        Paste the full code (64 characters). Spaces are ignored.
                    </p>
                    {fieldErrors.code ? (
                        <p
                            className="text-base text-red-600"
                            role="alert"
                        >
                            {fieldErrors.code}
                        </p>
                    ) : null}
                </div>

                {formError ? (
                    <p
                        className="rounded-[12px] border-[0.5px] border-red-200 bg-red-50 px-3 py-2.5 text-base text-red-800"
                        role="alert"
                    >
                        {formError}
                    </p>
                ) : null}

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 items-center justify-center rounded-[100px] bg-zinc-900 text-base font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? "Verifying…" : "Verify email"}
                </button>
            </form>

            <div
                className={`rounded-[12px] border-[0.5px] border-dashed border-[var(--spatialx-border)] p-4 ${showExpiredHint ? "bg-amber-50" : ""}`}
            >
                <h2 className="text-base font-medium text-[var(--spatialx-text)]">
                    Code expired or no email?
                </h2>
                <p className="mt-1 text-base font-light text-[var(--spatialx-text-muted)]">
                    We will only email addresses that have an{" "}
                    <span className="font-medium">unverified</span> account. Max{" "}
                    <span className="font-medium">5 emails per 24 hours</span>{" "}
                    and at least <span className="font-medium">60 seconds</span>{" "}
                    between sends.
                </p>
                {resendInfo ? (
                    <p
                        className="mt-2 rounded-[12px] border-[0.5px] border-[var(--spatialx-green)]/25 bg-[var(--spatialx-green-fill)] px-3 py-2.5 text-base font-normal text-[var(--spatialx-green-ink)]"
                        role="status"
                    >
                        {resendInfo}
                    </p>
                ) : null}
                {resendError ? (
                    <p
                        className="mt-2 rounded-[12px] border-[0.5px] border-red-200 bg-red-50 px-3 py-2.5 text-base text-red-800"
                        role="alert"
                    >
                        {resendError}
                    </p>
                ) : null}
                <button
                    type="button"
                    disabled={resendSubmitting}
                    onClick={handleResend}
                    className="mt-3 flex h-11 w-full items-center justify-center rounded-[100px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg)] text-base font-medium text-[var(--spatialx-text)] transition hover:bg-[var(--spatialx-bg-muted)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4"
                >
                    {resendSubmitting ? "Sending…" : "Email me a new code"}
                </button>
            </div>
        </div>
    );
}

function VerifyEmailFallback() {
    return (
        <div className="flex min-h-[200px] items-center justify-center text-base font-light text-[var(--spatialx-text-muted)]">
            Loading…
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[var(--spatialx-bg)] px-4 py-16">
            <div className="w-full max-w-md rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-surface)] p-8">
                <div className="mb-8 text-center">
                    <h1 className="font-display text-3xl font-normal tracking-tight text-[var(--spatialx-text)]">
                        Verify your email
                    </h1>
                    <p className="mt-2 text-base font-light text-[var(--spatialx-text-muted)]">
                        Enter the code from your latest email, then sign in.
                    </p>
                </div>

                <Suspense fallback={<VerifyEmailFallback />}>
                    <VerifyEmailForm />
                </Suspense>

                <p className="mt-8 text-center text-base font-light text-[var(--spatialx-text-muted)]">
                    Wrong email or need an account?{" "}
                    <Link
                        href="/sign-up"
                        className="font-medium text-[var(--spatialx-green)] underline-offset-4 hover:underline"
                    >
                        Sign up
                    </Link>
                    {" · "}
                    <Link
                        href="/sign-in"
                        className="font-medium text-[var(--spatialx-green)] underline-offset-4 hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
