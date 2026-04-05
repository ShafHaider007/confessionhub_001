"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

function LogoMark({ className }: { className?: string }) {
    return (
        <span
            className={`inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--spatialx-green)] ${className ?? ""}`}
            aria-hidden
        />
    );
}

const hairline = "border-[0.5px] border-[var(--spatialx-border)]";

export function DashboardHeader() {
    return (
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link
                href="/"
                className="flex items-center gap-2 text-base font-medium text-[var(--spatialx-text)]"
            >
                <LogoMark />
                SpatialX
            </Link>
            <nav className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
                <Link
                    href="/dashboard"
                    className="text-base font-normal text-[var(--spatialx-text-muted)] transition hover:text-[var(--spatialx-text)]"
                >
                    Overview
                </Link>
                <Link
                    href="/dashboard/map"
                    className="text-base font-normal text-[var(--spatialx-text-muted)] transition hover:text-[var(--spatialx-text)]"
                >
                    Map
                </Link>
                <button
                    type="button"
                    onClick={() =>
                        signOut({ callbackUrl: "/", redirect: true })
                    }
                    className={`rounded-[100px] border ${hairline} bg-transparent px-5 py-2.5 text-base font-medium text-[var(--spatialx-text)] transition hover:border-zinc-400`}
                >
                    Sign out
                </button>
            </nav>
        </div>
    );
}
