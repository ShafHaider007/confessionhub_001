"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

const placeholders = [
    {
        title: "Areas of interest",
        body: "Define regions and revisit them anytime—no map on this screen yet, just your workspace.",
    },
    {
        title: "Analysis runs",
        body: "When flows are wired up, summaries and exports for each run will land here.",
    },
    {
        title: "Team",
        body: "Invite collaborators and keep everyone on the same spatial context.",
    },
] as const;

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="flex min-h-[40vh] flex-1 items-center justify-center">
                <p className="text-base font-light text-[var(--spatialx-text-muted)]">
                    Loading…
                </p>
            </div>
        );
    }

    const name = session?.user?.name?.trim();
    const email = session?.user?.email;

    return (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6 sm:py-20">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--spatialx-text-muted)]">
                Dashboard
            </p>
            <h1 className="font-display mt-3 text-4xl font-normal tracking-tight text-[var(--spatialx-text)] sm:text-5xl">
                {name ? `Welcome back, ${name}` : "Welcome back"}
            </h1>
            {email ? (
                <p className="mt-2 text-base font-light text-[var(--spatialx-text-muted)]">
                    {email}
                </p>
            ) : null}
            <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-[var(--spatialx-text-muted)]">
                Open the map to explore the satellite basemap. This overview
                will grow with projects and analysis.
            </p>

            <div className="mt-10">
                <Link
                    href="/dashboard/map"
                    className="inline-flex h-[3.25rem] min-h-[3.25rem] items-center justify-center rounded-[100px] bg-zinc-900 px-8 text-base font-medium text-white transition hover:bg-zinc-800"
                >
                    Open map
                </Link>
            </div>

            <ul className="mt-14 grid gap-[0.5px] overflow-hidden rounded-[12px] bg-[var(--spatialx-border)] sm:grid-cols-2 lg:grid-cols-3">
                {placeholders.map((item) => (
                    <li
                        key={item.title}
                        className="bg-[var(--spatialx-bg)] p-6 sm:p-8"
                    >
                        <h2 className="text-base font-medium text-[var(--spatialx-text)]">
                            {item.title}
                        </h2>
                        <p className="mt-2 text-[0.9375rem] font-light leading-relaxed text-[var(--spatialx-text-muted)] sm:text-base">
                            {item.body}
                        </p>
                    </li>
                ))}
            </ul>

            <p className="mt-12 text-base font-light text-[var(--spatialx-text-muted)]">
                <Link
                    href="/"
                    className="font-medium text-[var(--spatialx-green)] underline-offset-4 hover:underline"
                >
                    ← Back to home
                </Link>
            </p>
        </main>
    );
}
