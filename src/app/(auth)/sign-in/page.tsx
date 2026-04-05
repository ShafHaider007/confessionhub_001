"use client";

import { getSession, signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";

import { signInSchema } from "@/schemas/signInSchema";

/**
 * NextAuth / middleware sometimes pass a full same-origin URL. App Router needs a path.
 */
function safeCallbackUrl(raw: string | null): string {
    if (!raw?.trim()) return "/";
    const v = raw.trim();

    if (v.startsWith("/") && !v.startsWith("//")) {
        return v;
    }

    try {
        const u = new URL(v);
        const expectedOrigin =
            typeof window !== "undefined"
                ? window.location.origin
                : process.env.NEXTAUTH_URL
                  ? new URL(process.env.NEXTAUTH_URL).origin
                  : null;
        if (expectedOrigin && u.origin === expectedOrigin) {
            const path = `${u.pathname}${u.search}`;
            return path && path !== "" ? path : "/";
        }
    } catch {
        /* ignore */
    }

    return "/";
}

function navigateToCallback(callbackUrl: string) {
    const path = callbackUrl.startsWith("/") ? callbackUrl : "/";
    window.location.assign(`${window.location.origin}${path}`);
}

function SignInForm() {
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{
        email?: string;
        password?: string;
    }>({});

    const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
    const justVerified = searchParams.get("verified") === "1";

    useEffect(() => {
        function onPageShow(e: PageTransitionEvent) {
            if (e.persisted) {
                void getSession();
            }
        }
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, []);

    useLayoutEffect(() => {
        if (status !== "authenticated" || !session) return;
        navigateToCallback(callbackUrl);
    }, [status, session, callbackUrl]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);
        setFieldErrors({});

        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) {
            const flat = parsed.error.flatten().fieldErrors;
            setFieldErrors({
                email: flat.email?.[0],
                password: flat.password?.[0],
            });
            return;
        }

        setSubmitting(true);
        try {
            const result = await signIn("credentials", {
                email: parsed.data.email,
                password: parsed.data.password,
                redirect: false,
                callbackUrl,
            });

            if (result?.error) {
                setFormError("Invalid email or password. Try again.");
                return;
            }

            if (result?.ok) {
                navigateToCallback(callbackUrl);
            }
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

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
            noValidate
        >
            {justVerified ? (
                <p
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                    role="status"
                >
                    Email verified. Sign in with your password to continue.
                </p>
            ) : null}
            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="sign-in-email"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                    Email
                </label>
                <input
                    id="sign-in-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-zinc-400 transition focus:border-zinc-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
                    disabled={submitting}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={
                        fieldErrors.email ? "sign-in-email-error" : undefined
                    }
                />
                {fieldErrors.email ? (
                    <p
                        id="sign-in-email-error"
                        className="text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {fieldErrors.email}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="sign-in-password"
                    className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                    Password
                </label>
                <input
                    id="sign-in-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-zinc-400 transition focus:border-zinc-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
                    disabled={submitting}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={
                        fieldErrors.password ? "sign-in-password-error" : undefined
                    }
                />
                {fieldErrors.password ? (
                    <p
                        id="sign-in-password-error"
                        className="text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {fieldErrors.password}
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
                {submitting ? "Signing in…" : "Sign in"}
            </button>
        </form>
    );
}

function SignInFallback() {
    return (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            Loading…
        </div>
    );
}

export default function SignInPage() {
    return (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Sign in
                    </h1>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Use the email and password for your account.
                    </p>
                </div>

                <Suspense fallback={<SignInFallback />}>
                    <SignInForm />
                </Suspense>

                <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/sign-up"
                        className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
