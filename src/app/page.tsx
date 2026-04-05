import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";

function LogoMark({ className }: { className?: string }) {
    return (
        <span
            className={`inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--spatialx-green)] ${className ?? ""}`}
            aria-hidden
        />
    );
}

function NavLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="text-base font-normal text-[var(--spatialx-text-muted)] transition hover:text-[var(--spatialx-text)]"
        >
            {children}
        </Link>
    );
}

const hairline = "border-[0.5px] border-[var(--spatialx-border)]";
const pill = "rounded-[100px]";

const capabilities = [
    {
        title: "Satellite imagery access",
        description:
            "Pull Sentinel-powered scenes for your AOI with sensible defaults and clear time ranges.",
        iconClass: "bg-cyan-100 text-cyan-800",
        glyph: "◎",
    },
    {
        title: "Change detection",
        description:
            "Compare epochs to spot what shifted—built for planners who need signal, not noise.",
        iconClass: "bg-amber-100 text-amber-900",
        glyph: "◇",
    },
    {
        title: "Custom indices",
        description:
            "Vegetation, water, and other indices tuned for quick reads across seasons.",
        iconClass: "bg-sky-100 text-sky-900",
        glyph: "◆",
    },
    {
        title: "Secure API",
        description:
            "Keep credentials on the server. Your keys never ship to the browser.",
        iconClass: "bg-violet-100 text-violet-900",
        glyph: "▣",
    },
    {
        title: "Analytics dashboard",
        description:
            "A focused workspace for summaries, exports, and what to do next.",
        iconClass: "bg-emerald-100 text-emerald-900",
        glyph: "▤",
    },
    {
        title: "Team collaboration",
        description:
            "Share context with your crew—same views, same ground truth.",
        iconClass: "bg-rose-100 text-rose-900",
        glyph: "◎",
    },
] as const;

const steps = [
    {
        n: "01",
        title: "Define your area",
        body: "Draw polygons or upload boundary files to lock the map to your region.",
    },
    {
        n: "02",
        title: "Choose your analysis",
        body: "Pick indices—vegetation, water, and more—and set the time windows you care about.",
    },
    {
        n: "03",
        title: "Explore and export",
        body: "Interact with results and download GeoTIFFs, CSVs, or shareable summaries.",
    },
] as const;

export default async function Home() {
    const session = await getServerSession(authOptions);
    const authed = Boolean(session?.user);

    return (
        <div className="flex min-h-full flex-1 flex-col bg-[var(--spatialx-bg)] text-[var(--spatialx-text)]">
            <header
                className={`sticky top-0 z-50 border-b ${hairline} bg-[var(--spatialx-bg)]/95 backdrop-blur-sm`}
            >
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-base font-medium tracking-tight text-[var(--spatialx-text)]"
                    >
                        <LogoMark />
                        SpatialX
                    </Link>
                    <nav
                        className="hidden items-center gap-8 md:flex"
                        aria-label="Primary"
                    >
                        <NavLink href="#capabilities">Features</NavLink>
                        <NavLink href="#how-it-works">How it works</NavLink>
                    </nav>
                    <div className="flex shrink-0 items-center gap-3">
                        {authed ? (
                            <Link
                                href="/dashboard"
                                className={`${pill} bg-zinc-900 px-5 py-2.5 text-base font-medium text-white transition hover:bg-zinc-800`}
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href="/sign-in"
                                className={`${pill} bg-zinc-900 px-5 py-2.5 text-base font-medium text-white transition hover:bg-zinc-800`}
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main>
                <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
                    <div className="max-w-[700px]">
                        <p
                            className={`mb-6 inline-flex items-center gap-2 ${pill} border ${hairline} bg-[var(--spatialx-green-fill)] px-4 py-2 text-sm font-normal text-[var(--spatialx-green-ink)]`}
                        >
                            <LogoMark className="h-1.5 w-1.5" />
                            Geospatial intelligence, simplified
                        </p>
                        <h1 className="font-display text-[2.5rem] font-normal leading-[1.1] tracking-tight text-[var(--spatialx-text)] sm:text-5xl lg:text-6xl">
                            See the Earth through{" "}
                            <em className="font-normal italic text-[var(--spatialx-green)]">
                                data
                            </em>
                        </h1>
                        <p className="mt-6 max-w-xl text-xl font-light leading-relaxed text-[var(--spatialx-text-muted)] sm:text-2xl sm:leading-snug">
                            SpatialX turns satellite imagery into actionable
                            insight for researchers and planners—without
                            drowning you in complexity.
                        </p>
                        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                            {authed ? (
                                <Link
                                    href="/dashboard"
                                    className={`inline-flex h-[3.25rem] min-h-[3.25rem] items-center justify-center ${pill} bg-zinc-900 px-8 text-base font-medium text-white transition hover:bg-zinc-800`}
                                >
                                    Open dashboard
                                </Link>
                            ) : (
                                <Link
                                    href="/sign-up"
                                    className={`inline-flex h-[3.25rem] min-h-[3.25rem] items-center justify-center ${pill} bg-zinc-900 px-8 text-base font-medium text-white transition hover:bg-zinc-800`}
                                >
                                    Get started free
                                </Link>
                            )}
                            <Link
                                href="#how-it-works"
                                className="inline-flex items-center justify-center text-base font-normal text-[var(--spatialx-text-muted)] transition hover:text-[var(--spatialx-text)]"
                            >
                                Learn more →
                            </Link>
                        </div>
                    </div>
                </section>

                <section
                    id="capabilities"
                    className={`border-t ${hairline} py-16 sm:py-20 lg:py-24`}
                >
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--spatialx-text-muted)]">
                            Capabilities
                        </p>
                        <h2 className="font-display mt-3 max-w-2xl text-4xl font-normal tracking-tight text-[var(--spatialx-text)] sm:text-5xl">
                            Everything you need to work with Earth&apos;s surface
                        </h2>
                        <div
                            className={`mt-14 rounded-[12px] bg-[var(--spatialx-border)] p-[0.5px]`}
                        >
                            <ul className="grid grid-cols-1 gap-[0.5px] overflow-hidden rounded-[11px] bg-[var(--spatialx-border)] sm:grid-cols-2 lg:grid-cols-3">
                                {capabilities.map((item) => (
                                    <li
                                        key={item.title}
                                        className="bg-[var(--spatialx-bg)] px-6 py-8 sm:px-8 sm:py-10"
                                    >
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-lg text-base ${item.iconClass}`}
                                            aria-hidden
                                        >
                                            {item.glyph}
                                        </div>
                                        <h3 className="mt-4 text-base font-medium text-[var(--spatialx-text)]">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-[0.9375rem] font-light leading-relaxed text-[var(--spatialx-text-muted)] sm:text-base">
                                            {item.description}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section
                    id="how-it-works"
                    className={`border-t ${hairline} bg-[var(--spatialx-bg-muted)] py-16 sm:py-20 lg:py-24`}
                >
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--spatialx-text-muted)]">
                            How it works
                        </p>
                        <h2 className="font-display mt-3 max-w-2xl text-4xl font-normal tracking-tight text-[var(--spatialx-text)] sm:text-5xl">
                            From raw satellite data to clear answers
                        </h2>
                        <ol className="mt-14 grid gap-12 sm:grid-cols-3 lg:gap-16">
                            {steps.map((step) => (
                                <li key={step.n}>
                                    <p className="font-display text-5xl font-normal tabular-nums text-neutral-300 sm:text-6xl">
                                        {step.n}
                                    </p>
                                    <h3 className="mt-4 text-lg font-medium text-[var(--spatialx-text)]">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-base font-light leading-relaxed text-[var(--spatialx-text-muted)]">
                                        {step.body}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section
                    className={`border-t ${hairline} py-16 sm:py-20 lg:py-24`}
                >
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <h2 className="font-display max-w-xl text-4xl font-normal tracking-tight text-[var(--spatialx-text)] sm:text-5xl">
                            Ready to see your region differently?
                        </h2>
                        <p className="mt-4 max-w-xl text-lg font-light leading-relaxed text-[var(--spatialx-text-muted)]">
                            Start for free — no credit card needed. Upgrade when
                            your project grows.
                        </p>
                        <Link
                            href={authed ? "/dashboard" : "/sign-up"}
                            className={`mt-10 inline-flex h-[3.25rem] min-h-[3.25rem] items-center justify-center ${pill} bg-zinc-900 px-10 text-base font-medium text-white transition hover:bg-zinc-800`}
                        >
                            {authed ? "Open dashboard" : "Start exploring →"}
                        </Link>
                    </div>
                </section>
            </main>

            <footer className={`mt-auto border-t ${hairline}`}>
                {!authed ? (
                    <div
                        className={`border-b ${hairline} bg-[var(--spatialx-bg-muted)]/50 py-6 sm:py-7`}
                    >
                        <p className="mx-auto max-w-6xl px-4 text-center text-sm font-light leading-relaxed text-[var(--spatialx-text-muted)] sm:px-6 sm:text-base">
                            Registered but not verified?{" "}
                            <Link
                                href="/verify-email"
                                className="font-medium text-[var(--spatialx-green)] underline-offset-4 hover:underline"
                            >
                                Enter your code
                            </Link>{" "}
                            (valid 10 minutes) or request a new email there if
                            it expired.
                        </p>
                    </div>
                ) : null}
                <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-base font-medium text-[var(--spatialx-text)]"
                    >
                        <LogoMark />
                        SpatialX
                    </Link>
                    <p className="text-base font-light text-[var(--spatialx-text-muted)]">
                        © {new Date().getFullYear()} SpatialX. Built for the
                        Earth.
                    </p>
                </div>
            </footer>
        </div>
    );
}
