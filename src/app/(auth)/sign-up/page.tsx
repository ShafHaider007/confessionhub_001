"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { signUpSchema } from "@/schemas/signUpSchema";
import type { ApiResponse } from "@/types/ApiResponse";

export default function SignUpPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{
        username?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    useEffect(() => {
        if (status === "authenticated" && session) {
            router.replace("/");
        }
    }, [status, session, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);
        setSuccessMessage(null);
        setFieldErrors({});

        const parsed = signUpSchema.safeParse({ username, password, email });
        if (!parsed.success) {
            const flat = parsed.error.flatten().fieldErrors;
            setFieldErrors({
                username: flat.username?.[0],
                email: flat.email?.[0],
                password: flat.password?.[0],
            });
            return;
        }

        if (confirmPassword !== parsed.data.password) {
            setFieldErrors({ confirmPassword: "Passwords do not match" });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/sign-up", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: parsed.data.username,
                    email: parsed.data.email,
                    password: parsed.data.password,
                }),
            });

            const data = (await res.json()) as ApiResponse;

            if (!res.ok || !data.success) {
                setFormError(data.message ?? "Could not create account. Try again.");
                return;
            }

            setSuccessMessage(data.message);
            setRegisteredEmail(parsed.data.email);
            setUsername("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        } catch {
            setFormError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    if (status === "loading" || status === "authenticated") {
        return (
            <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[var(--spatialx-bg)] px-4 py-16">
                <p className="text-base font-light text-[var(--spatialx-text-muted)]">
                    {status === "loading" ? "Loading…" : "Redirecting…"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[var(--spatialx-bg)] px-4 py-16">
            <div className="w-full max-w-md rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-surface)] p-8">
                <div className="mb-8 text-center">
                    <h1 className="font-display text-3xl font-normal tracking-tight text-[var(--spatialx-text)]">
                        Create an account
                    </h1>
                    <p className="mt-2 text-base font-light text-[var(--spatialx-text-muted)]">
                        Choose a username, then verify your email to sign in.
                    </p>
                </div>

                {successMessage ? (
                    <div className="flex flex-col gap-6">
                        <p
                            className="rounded-[12px] border-[0.5px] border-[var(--spatialx-green)]/25 bg-[var(--spatialx-green-fill)] px-3 py-3 text-base font-normal text-[var(--spatialx-green-ink)]"
                            role="status"
                        >
                            {successMessage}
                        </p>
                        <div className="flex flex-col gap-3 text-center text-base font-light text-[var(--spatialx-text-muted)]">
                            <Link
                                href={
                                    registeredEmail
                                        ? `/verify-email?email=${encodeURIComponent(registeredEmail)}`
                                        : "/verify-email"
                                }
                                className="inline-flex h-12 items-center justify-center rounded-[100px] bg-zinc-900 text-base font-medium text-white transition hover:bg-zinc-800"
                            >
                                Enter verification code
                            </Link>
                            <p>
                                After you verify your email, you can{" "}
                                <Link
                                    href="/sign-in"
                                    className="font-medium text-[var(--spatialx-green)] underline-offset-4 hover:underline"
                                >
                                    sign in
                                </Link>
                                .
                            </p>
                        </div>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-5"
                        noValidate
                    >
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="sign-up-username"
                                className="text-base font-medium text-[var(--spatialx-text)]"
                            >
                                Username
                            </label>
                            <input
                                id="sign-up-username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg-muted)] px-3 py-3 text-base text-[var(--spatialx-text)] outline-none ring-[var(--spatialx-green)]/25 transition focus:border-[var(--spatialx-green)] focus:ring-2"
                                disabled={submitting}
                                aria-invalid={!!fieldErrors.username}
                                aria-describedby={
                                    fieldErrors.username
                                        ? "sign-up-username-error"
                                        : undefined
                                }
                            />
                            {fieldErrors.username ? (
                                <p
                                    id="sign-up-username-error"
                                    className="text-base text-red-600"
                                    role="alert"
                                >
                                    {fieldErrors.username}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="sign-up-email"
                                className="text-base font-medium text-[var(--spatialx-text)]"
                            >
                                Email
                            </label>
                            <input
                                id="sign-up-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg-muted)] px-3 py-3 text-base text-[var(--spatialx-text)] outline-none ring-[var(--spatialx-green)]/25 transition focus:border-[var(--spatialx-green)] focus:ring-2"
                                disabled={submitting}
                                aria-invalid={!!fieldErrors.email}
                                aria-describedby={
                                    fieldErrors.email
                                        ? "sign-up-email-error"
                                        : undefined
                                }
                            />
                            {fieldErrors.email ? (
                                <p
                                    id="sign-up-email-error"
                                    className="text-base text-red-600"
                                    role="alert"
                                >
                                    {fieldErrors.email}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="sign-up-password"
                                className="text-base font-medium text-[var(--spatialx-text)]"
                            >
                                Password
                            </label>
                            <input
                                id="sign-up-password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg-muted)] px-3 py-3 text-base text-[var(--spatialx-text)] outline-none ring-[var(--spatialx-green)]/25 transition focus:border-[var(--spatialx-green)] focus:ring-2"
                                disabled={submitting}
                                aria-invalid={!!fieldErrors.password}
                                aria-describedby={
                                    fieldErrors.password
                                        ? "sign-up-password-error"
                                        : undefined
                                }
                            />
                            {fieldErrors.password ? (
                                <p
                                    id="sign-up-password-error"
                                    className="text-base text-red-600"
                                    role="alert"
                                >
                                    {fieldErrors.password}
                                </p>
                            ) : (
                                <p className="text-base font-light text-[var(--spatialx-text-muted)]">
                                    8–20 characters, with upper &amp; lower case, a
                                    number, and a special character (@$!%*?&amp;).
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="sign-up-confirm"
                                className="text-base font-medium text-[var(--spatialx-text)]"
                            >
                                Confirm password
                            </label>
                            <input
                                id="sign-up-confirm"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                className="rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg-muted)] px-3 py-3 text-base text-[var(--spatialx-text)] outline-none ring-[var(--spatialx-green)]/25 transition focus:border-[var(--spatialx-green)] focus:ring-2"
                                disabled={submitting}
                                aria-invalid={!!fieldErrors.confirmPassword}
                                aria-describedby={
                                    fieldErrors.confirmPassword
                                        ? "sign-up-confirm-error"
                                        : undefined
                                }
                            />
                            {fieldErrors.confirmPassword ? (
                                <p
                                    id="sign-up-confirm-error"
                                    className="text-base text-red-600"
                                    role="alert"
                                >
                                    {fieldErrors.confirmPassword}
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
                            {submitting ? "Creating account…" : "Sign up"}
                        </button>
                    </form>
                )}

                <p className="mt-8 text-center text-base font-light text-[var(--spatialx-text-muted)]">
                    Already have an account?{" "}
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
