"use client";

import { useEffect, useState, type ReactNode } from "react";

const teal = "#13AF9F";

const codeBlock =
    "rounded-md px-3 py-2 font-mono text-[11px] leading-relaxed text-[var(--spatialx-text)] bg-[var(--spatialx-bg-muted)]";

function InfoIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={teal}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
        </svg>
    );
}

function Chevron({ open }: { open: boolean }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
        >
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

export type LargeFileGuidancePayload = {
    fileName: string;
    sizeMb: string;
    variant: "raw" | "pmtiles";
};

type LargeFileGuidancePanelProps = LargeFileGuidancePayload & {
    onChooseDifferentFile: () => void;
};

export function LargeFileGuidancePanel({
    fileName,
    sizeMb,
    variant,
    onChooseDifferentFile,
}: LargeFileGuidancePanelProps) {
    const [openTippecanoe, setOpenTippecanoe] = useState(true);
    const [openQgis, setOpenQgis] = useState(false);
    const [openOnline, setOpenOnline] = useState(false);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onChooseDifferentFile();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onChooseDifferentFile]);

    return (
        <div
            className="pointer-events-auto absolute inset-0 z-[90] flex items-center justify-center p-4"
            role="presentation"
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                aria-label="Dismiss"
                onClick={onChooseDifferentFile}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="large-file-guidance-title"
                className="relative z-10 max-h-[min(85dvh,calc(100%-2rem))] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--spatialx-border)] bg-[var(--spatialx-surface)] p-4 shadow-2xl"
                onClick={(e) => {
                    e.stopPropagation();
                }}
                onKeyDown={(e) => {
                    e.stopPropagation();
                }}
            >
        <div
            className="rounded-lg border border-[color-mix(in_srgb,var(--spatialx-border)_80%,transparent)] bg-[var(--spatialx-bg-muted)]/80 p-3"
        >
            <div className="flex gap-2">
                <InfoIcon />
                <div className="min-w-0 flex-1">
                    <h3
                        id="large-file-guidance-title"
                        className="text-sm font-semibold text-[var(--spatialx-text)]"
                    >
                        This file needs pre-processing
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--spatialx-text-muted)]">
                        <span className="font-medium text-[var(--spatialx-text)]">
                            {fileName}
                        </span>{" "}
                        · {sizeMb} MB
                    </p>
                    {variant === "pmtiles" ? (
                        <p className="mt-2 text-xs leading-relaxed text-[var(--spatialx-text)]">
                            This PMTiles file exceeds the maximum size we load in
                            the browser ({sizeMb} MB). Try splitting the dataset or
                            lowering zoom levels when building the archive.
                        </p>
                    ) : (
                        <p className="mt-2 text-xs leading-relaxed text-[var(--spatialx-text)]">
                            Large vector files must be converted to{" "}
                            <strong className="font-medium" style={{ color: teal }}>
                                PMTiles
                            </strong>{" "}
                            first. PMTiles archives are small and stream efficiently
                            on the map.
                        </p>
                    )}
                </div>
            </div>

            {variant === "raw" ? (
                <div className="mt-3 space-y-2 border-t border-[var(--spatialx-border)] pt-3">
                    <Collapsible
                        title="Using tippecanoe (recommended)"
                        open={openTippecanoe}
                        onToggle={() => {
                            setOpenTippecanoe((o) => !o);
                        }}
                    >
                        <p className="mb-2 text-[11px] text-[var(--spatialx-text-muted)]">
                            Install tippecanoe, then run:
                        </p>
                        <p className="mb-2 text-[11px] text-[var(--spatialx-text-muted)]">
                            macOS (Homebrew):
                        </p>
                        <pre className={`mb-2 ${codeBlock}`}>
                            brew install tippecanoe
                        </pre>
                        <p className="mb-2 text-[11px] text-[var(--spatialx-text-muted)]">
                            Ubuntu / Debian:
                        </p>
                        <pre className={`mb-2 ${codeBlock}`}>
                            sudo apt-get install tippecanoe
                        </pre>
                        <pre className={`mb-2 whitespace-pre-wrap ${codeBlock}`}>
                            {`tippecanoe \\
  -o output.pmtiles \\
  -z 14 -Z 0 \\
  --drop-densest-as-needed \\
  --extend-zooms-if-still-dropping \\
  input.geojson`}
                        </pre>
                        <p className="text-[11px] text-[var(--spatialx-text-muted)]">
                            Upload the{" "}
                            <code className="rounded bg-[var(--spatialx-surface)] px-1">
                                output.pmtiles
                            </code>{" "}
                            file here.
                        </p>
                    </Collapsible>

                    <Collapsible
                        title="Using QGIS"
                        open={openQgis}
                        onToggle={() => {
                            setOpenQgis((o) => !o);
                        }}
                    >
                        <ol className="list-decimal space-y-1.5 pl-4 text-[11px] text-[var(--spatialx-text-muted)]">
                            <li>
                                Install the{" "}
                                <strong className="text-[var(--spatialx-text)]">
                                    Vector Tiles Writer
                                </strong>{" "}
                                plugin:{" "}
                                <span className="text-[var(--spatialx-text)]">
                                    QGIS → Plugins → Manage and Install Plugins
                                </span>{" "}
                                → search &quot;Vector Tiles Writer&quot; → Install.
                            </li>
                            <li>Load your vector layer in QGIS.</li>
                            <li>
                                Use{" "}
                                <strong className="text-[var(--spatialx-text)]">
                                    Processing → Write Vector Tiles (MBTiles)
                                </strong>{" "}
                                or the Vector Tiles Writer tool to export{" "}
                                <code className="rounded bg-[var(--spatialx-surface)] px-1">
                                    .mbtiles
                                </code>
                                .
                            </li>
                            <li>
                                Convert to PMTiles with the CLI:
                                <pre className={`mt-2 whitespace-pre-wrap ${codeBlock}`}>
                                    {`npm install -g pmtiles
pmtiles convert output.mbtiles output.pmtiles`}
                                </pre>
                            </li>
                            <li>Upload output.pmtiles to SpatialX.</li>
                        </ol>
                    </Collapsible>

                    <Collapsible
                        title="Online tools (no install)"
                        open={openOnline}
                        onToggle={() => {
                            setOpenOnline((o) => !o);
                        }}
                    >
                        <ul className="list-disc space-y-2 pl-4 text-[11px] text-[var(--spatialx-text-muted)]">
                            <li>
                                <a
                                    href="https://mapshaper.org"
                                    className="font-medium underline decoration-[color-mix(in_srgb,var(--spatialx-text-muted)_50%,transparent)] underline-offset-2 hover:decoration-[var(--spatialx-text)]"
                                    style={{ color: teal }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    mapshaper.org
                                </a>{" "}
                                — simplify or reduce vertices, then export GeoJSON and
                                run tippecanoe locally.
                            </li>
                            <li>
                                <a
                                    href="https://pmtiles.io"
                                    className="font-medium underline decoration-[color-mix(in_srgb,var(--spatialx-text-muted)_50%,transparent)] underline-offset-2 hover:decoration-[var(--spatialx-text)]"
                                    style={{ color: teal }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    pmtiles.io
                                </a>{" "}
                                — browser-based conversion helpers.
                            </li>
                            <li>
                                <a
                                    href="https://felt.com"
                                    className="font-medium underline decoration-[color-mix(in_srgb,var(--spatialx-text-muted)_50%,transparent)] underline-offset-2 hover:decoration-[var(--spatialx-text)]"
                                    style={{ color: teal }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    felt.com
                                </a>{" "}
                                — hosted GIS workflows; export tiles when available,
                                then upload .pmtiles here.
                            </li>
                        </ul>
                    </Collapsible>
                </div>
            ) : null}

            <button
                type="button"
                onClick={onChooseDifferentFile}
                className="mt-3 w-full rounded-[100px] border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-surface)] px-4 py-2 text-sm font-medium text-[var(--spatialx-text)] transition hover:border-zinc-400"
            >
                Choose a different file
            </button>
        </div>
            </div>
        </div>
    );
}

function Collapsible({
    title,
    open,
    onToggle,
    children,
}: {
    title: string;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
}) {
    return (
        <div className="rounded-md border border-[var(--spatialx-border)] bg-[var(--spatialx-surface)]">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--spatialx-text)]"
                aria-expanded={open}
            >
                <span style={{ color: teal }}>{title}</span>
                <Chevron open={open} />
            </button>
            {open ? (
                <div className="border-t border-[var(--spatialx-border)] px-3 py-2">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
