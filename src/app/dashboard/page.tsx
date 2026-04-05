"use client";

import { signOut, useSession } from "next-auth/react";

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Loading…
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
            <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Welcome to the dashboard
                </h1>
                {session?.user ? (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                        {session.user.name
                            ? `Signed in as ${session.user.name}`
                            : "You are signed in."}
                        {session.user.email ? (
                            <span className="block text-zinc-500 dark:text-zinc-500">
                                {session.user.email}
                            </span>
                        ) : null}
                    </p>
                ) : null}

                <button
                    type="button"
                    onClick={() =>
                        signOut({ callbackUrl: "/", redirect: true })
                    }
                    className="mt-8 flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 sm:w-auto sm:px-8"
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}
