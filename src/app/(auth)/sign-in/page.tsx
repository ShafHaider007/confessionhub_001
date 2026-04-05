"use client";

import { getSession, signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";

import { signInSchema } from "@/schemas/signInSchema";

/** Where users land after a successful sign-in when no `callbackUrl` is provided. */
const DEFAULT_SIGNED_IN_PATH = "/dashboard";

/**
 * NextAuth / middleware sometimes pass a full same-origin URL. App Router needs a path.
 */
function safeCallbackUrl(raw: string | null): string {
    if (!raw?.trim()) return DEFAULT_SIGNED_IN_PATH;
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
            return path && path !== "" ? path : DEFAULT_SIGNED_IN_PATH;
        }
    } catch {
        /* ignore */
    }

    return DEFAULT_SIGNED_IN_PATH;
}

function navigateToCallback(callbackUrl: string) {
    const path = callbackUrl.startsWith("/") ? callbackUrl : DEFAULT_SIGNED_IN_PATH;
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
            <div className="flex min-h-[200px] items-center justify-center text-base font-light text-[var(--spatialx-text-muted)]">
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
                    className="rounded-[12px] border-[0.5px] border-[var(--spatialx-green)]/25 bg-[var(--spatialx-green-fill)] px-3 py-2.5 text-base font-normal text-[var(--spatialx-green-ink)]"
                    role="status"
                >
                    Email verified. Sign in with your password to continue.
                </p>
            ) : null}
            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="sign-in-email"
                    className="text-base font-medium text-[var(--spatialx-text)]"
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
                    className="rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg-muted)] px-3 py-3 text-base text-[var(--spatialx-text)] outline-none ring-[var(--spatialx-green)]/25 transition focus:border-[var(--spatialx-green)] focus:ring-2"
                    disabled={submitting}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={
                        fieldErrors.email ? "sign-in-email-error" : undefined
                    }
                />
                {fieldErrors.email ? (
                    <p
                        id="sign-in-email-error"
                        className="text-base text-red-600"
                        role="alert"
                    >
                        {fieldErrors.email}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="sign-in-password"
                    className="text-base font-medium text-[var(--spatialx-text)]"
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
                    className="rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-bg-muted)] px-3 py-3 text-base text-[var(--spatialx-text)] outline-none ring-[var(--spatialx-green)]/25 transition focus:border-[var(--spatialx-green)] focus:ring-2"
                    disabled={submitting}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={
                        fieldErrors.password ? "sign-in-password-error" : undefined
                    }
                />
                {fieldErrors.password ? (
                    <p
                        id="sign-in-password-error"
                        className="text-base text-red-600"
                        role="alert"
                    >
                        {fieldErrors.password}
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
                {submitting ? "Signing in…" : "Sign in"}
            </button>
        </form>
    );
}

function SignInFallback() {
    return (
        <div className="flex min-h-[200px] items-center justify-center text-base font-light text-[var(--spatialx-text-muted)]">
            Loading…
        </div>
    );
}

export default function SignInPage() {
    return (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[var(--spatialx-bg)] px-4 py-16">
            <div className="w-full max-w-md rounded-[12px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-surface)] p-8">
                <div className="mb-8 text-center">
                    <h1 className="font-display text-3xl font-normal tracking-tight text-[var(--spatialx-text)]">
                        Sign in
                    </h1>
                    <p className="mt-2 text-base font-light text-[var(--spatialx-text-muted)]">
                        Use the email and password for your account.
                    </p>
                </div>

                <Suspense fallback={<SignInFallback />}>
                    <SignInForm />
                </Suspense>

                <p className="mt-8 text-center text-base font-light text-[var(--spatialx-text-muted)]">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/sign-up"
                        className="font-medium text-[var(--spatialx-green)] underline-offset-4 hover:underline"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
