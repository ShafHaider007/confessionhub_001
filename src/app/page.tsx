import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export default async function Home() {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    return (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
            <main className="w-full max-w-lg text-center">
                <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    SpatialX
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {user
                        ? "Welcome back"
                        : "Geospatial maps and Sentinel-powered imagery"}
                </h1>

                {user ? (
                    <>
                        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                            {user.name
                                ? `You are signed in as ${user.name}.`
                                : "You are signed in."}
                        </p>
                        {user.email ? (
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                                {user.email}
                            </p>
                        ) : null}
                        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            <Link
                                href="/dashboard"
                                className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-8 text-sm font-medium text-white transition hover:bg-zinc-800 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                Go to dashboard
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Create an account, verify your email, then sign in to open
                            your dashboard.
                        </p>
                        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center sm:items-center">
                            <Link
                                href="/sign-in"
                                className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-8 text-sm font-medium text-white transition hover:bg-zinc-800 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/sign-up"
                                className="flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 sm:w-auto dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                            >
                                Sign up
                            </Link>
                        </div>
                        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-500">
                            Registered but not verified?{" "}
                            <Link
                                href="/verify-email"
                                className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                            >
                                Enter your code
                            </Link>{" "}
                            (valid 10 minutes) or request a new email there if it
                            expired.
                        </p>
                    </>
                )}
            </main>
        </div>
    );
}
