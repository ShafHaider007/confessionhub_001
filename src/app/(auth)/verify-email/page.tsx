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
            <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                {status === "loading" ? "Loading…" : "Redirecting…"}
            </div>
        );
    }

    const showExpiredHint = lastErrorCode === "CODE_EXPIRED";

    return (
        <div className="flex flex-col gap-8">
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Codes expire after{" "}
                <strong>{VERIFICATION_CODE_TTL_MINUTES} minutes</strong> for
                security. If yours expired, use &quot;Email me a new code&quot;
                (same email) — subject to rate limits.
            </p>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
                noValidate
            >
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="verify-email"
                        className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
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
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-zinc-400 transition focus:border-zinc-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
                        disabled={submitting}
                        required
                    />
                    {fieldErrors.email ? (
                        <p
                            className="text-sm text-red-600 dark:text-red-400"
                            role="alert"
                        >
                            {fieldErrors.email}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="verify-code"
                        className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
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
                        className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 outline-none ring-zinc-400 transition focus:border-zinc-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
                        disabled={submitting}
                        required
                        spellCheck={false}
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Paste the full code (64 characters). Spaces are ignored.
                    </p>
                    {fieldErrors.code ? (
                        <p
                            className="text-sm text-red-600 dark:text-red-400"
                            role="alert"
                        >
                            {fieldErrors.code}
                        </p>
                    ) : null}
                </div>

                {formError ? (
                    <p
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        role="alert"
                    >
                        {formError}
                    </p>
                ) : null}

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    {submitting ? "Verifying…" : "Verify email"}
                </button>
            </form>

            <div
                className={`rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-600 ${showExpiredHint ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}
            >
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Code expired or no email?
                </h2>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    We will only email addresses that have an{" "}
                    <strong>unverified</strong> account. Max{" "}
                    <strong>5 emails per 24 hours</strong> and at least{" "}
                    <strong>60 seconds</strong> between sends.
                </p>
                {resendInfo ? (
                    <p
                        className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                        role="status"
                    >
                        {resendInfo}
                    </p>
                ) : null}
                {resendError ? (
                    <p
                        className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        role="alert"
                    >
                        {resendError}
                    </p>
                ) : null}
                <button
                    type="button"
                    disabled={resendSubmitting}
                    onClick={handleResend}
                    className="mt-3 flex h-10 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 sm:w-auto sm:px-4"
                >
                    {resendSubmitting ? "Sending…" : "Email me a new code"}
                </button>
            </div>
        </div>
    );
}

function VerifyEmailFallback() {
    return (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            Loading…
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Verify your email
                    </h1>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Enter the code from your latest email, then sign in.
                    </p>
                </div>

                <Suspense fallback={<VerifyEmailFallback />}>
                    <VerifyEmailForm />
                </Suspense>

                <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Wrong email or need an account?{" "}
                    <Link
                        href="/sign-up"
                        className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                    >
                        Sign up
                    </Link>
                    {" · "}
                    <Link
                        href="/sign-in"
                        className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
