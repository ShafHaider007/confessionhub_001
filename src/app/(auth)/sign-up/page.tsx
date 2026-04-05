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
            <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {status === "loading" ? "Loading…" : "Redirecting…"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Create an account
                    </h1>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Choose a username, then verify your email to sign in.
                    </p>
                </div>

                {successMessage ? (
                    <div className="flex flex-col gap-6">
                        <p
                            className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                            role="status"
                        >
                            {successMessage}
                        </p>
                        <div className="flex flex-col gap-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
                            <Link
                                href={
                                    registeredEmail
                                        ? `/verify-email?email=${encodeURIComponent(registeredEmail)}`
                                        : "/verify-email"
                                }
                                className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                Enter verification code
                            </Link>
                            <p>
                                After you verify your email, you can{" "}
                                <Link
                                    href="/sign-in"
                                    className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
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
                                className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
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
                                className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-zinc-400 transition focus:border-zinc-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
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
                                    className="text-sm text-red-600 dark:text-red-400"
                                    role="alert"
                                >
                                    {fieldErrors.username}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="sign-up-email"
                                className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
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
                                className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-zinc-400 transition focus:border-zinc-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
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
                                    className="text-sm text-red-600 dark:text-red-400"
                                    role="alert"
                                >
                                    {fieldErrors.email}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="sign-up-password"
                                className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
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
                                className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-zinc-400 transition focus:border-zinc-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
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
                                    className="text-sm text-red-600 dark:text-red-400"
                                    role="alert"
                                >
                                    {fieldErrors.password}
                                </p>
                            ) : (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    8–20 characters, with upper &amp; lower case, a
                                    number, and a special character (@$!%*?&amp;).
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="sign-up-confirm"
                                className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
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
                                className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-zinc-400 transition focus:border-zinc-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
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
                                    className="text-sm text-red-600 dark:text-red-400"
                                    role="alert"
                                >
                                    {fieldErrors.confirmPassword}
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
                            {submitting ? "Creating account…" : "Sign up"}
                        </button>
                    </form>
                )}

                <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Already have an account?{" "}
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
