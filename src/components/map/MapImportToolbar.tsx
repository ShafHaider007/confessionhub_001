"use client";

import type { PickingInfo } from "@deck.gl/core";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PMTiles, TileType } from "pmtiles";

import type { LargeFileGuidancePayload } from "@/components/map/LargeFileGuidancePanel";
import { createPmtilesMvtLayer } from "@/components/map/layers/PMTilesMVTLayer";
import {
    MAX_PMTILES_IMPORT_BYTES,
    MAX_VECTOR_IMPORT_BYTES,
} from "@/lib/map/vectorImportLimits";
import {
    parseVectorImportFile,
    type ParsedVectorImport,
    VectorImportError,
} from "@/lib/map/parseVectorImportFile";

const hairline =
    "border-[0.5px] border-[var(--spatialx-border)] bg-[var(--spatialx-surface)]";

const teal = "#13AF9F";

/** Keep hover UI below the fixed dashboard header (`z-50`). */
const VIEWPORT_TOP_RESERVE_PX = 72;
const HOVER_TIP_MARGIN_PX = 8;
const HOVER_TIP_MAX_WIDTH_PX = 288;

function pickToViewportPoint(info: PickingInfo): { clientX: number; clientY: number } {
    const root =
        typeof document !== "undefined"
            ? document.querySelector("[data-spatialx-map-root]")
            : null;
    const canvas = root?.querySelector(
        "canvas.maplibregl-canvas",
    ) as HTMLCanvasElement | null;
    const r = canvas?.getBoundingClientRect();
    return {
        clientX: r ? r.left + info.x : info.x,
        clientY: r ? r.top + info.y : info.y,
    };
}

function clampHoverTipPosition(clientX: number, clientY: number) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 400;
    const vh = typeof window !== "undefined" ? window.innerHeight : 600;
    const estH = 56;

    let left = clientX + HOVER_TIP_MARGIN_PX;
    let top = clientY + HOVER_TIP_MARGIN_PX;

    if (left + HOVER_TIP_MAX_WIDTH_PX > vw - HOVER_TIP_MARGIN_PX) {
        left = clientX - HOVER_TIP_MAX_WIDTH_PX - HOVER_TIP_MARGIN_PX;
    }
    if (left < HOVER_TIP_MARGIN_PX) {
        left = HOVER_TIP_MARGIN_PX;
    }

    if (top + estH > vh - HOVER_TIP_MARGIN_PX) {
        top = clientY - estH - HOVER_TIP_MARGIN_PX;
    }
    if (top < VIEWPORT_TOP_RESERVE_PX) {
        top = VIEWPORT_TOP_RESERVE_PX;
    }
    if (top + estH > vh - HOVER_TIP_MARGIN_PX) {
        top = Math.max(
            VIEWPORT_TOP_RESERVE_PX,
            vh - estH - HOVER_TIP_MARGIN_PX,
        );
    }

    return { left, top };
}

type PmtilesHoverTip = {
    text: string;
    clientX: number;
    clientY: number;
};

function formatSizeMbOneDecimal(bytes: number): string {
    return (Math.round((bytes / 1024 / 1024) * 10) / 10).toFixed(1);
}

function fileExtensionLower(name: string): string {
    const lower = name.toLowerCase();
    const dot = lower.lastIndexOf(".");
    return dot >= 0 ? lower.slice(dot) : "";
}

function baseName(name: string): string {
    const i = name.lastIndexOf(".");
    return i > 0 ? name.slice(0, i) : name;
}

function UploadIcon({ className }: { className?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
    );
}

function CloseIcon({ className }: { className?: string }) {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={className}
            aria-hidden
        >
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    );
}

export type PmtilesLayerReadyPayload = {
    id: string;
    layer: ReturnType<typeof createPmtilesMvtLayer>;
    objectUrl: string;
    bbox: [[number, number], [number, number]];
    minZoom: number;
    maxZoom: number;
    label: string;
};

export type PmtilesLayerSummary = {
    id: string;
    label: string;
    minZoom: number;
    maxZoom: number;
};

export type MapImportToolbarProps = {
    onImported: (result: ParsedVectorImport, fileName: string) => void;
    onClear: () => void;
    activeFileName: string | null;
    featureCount: number | null;
    onPmtilesLayerReady: (payload: PmtilesLayerReadyPayload) => void;
    onPmtilesLayerRemoved: (id: string) => void;
    pmtilesSummaries: PmtilesLayerSummary[];
    onMvtPick: (info: PickingInfo) => void;
    onLargeFileGuidance: (payload: LargeFileGuidancePayload) => void;
    importResetKey: number;
};

export function MapImportToolbar({
    onImported,
    onClear,
    activeFileName,
    featureCount,
    onPmtilesLayerReady,
    onPmtilesLayerRemoved,
    pmtilesSummaries,
    onMvtPick,
    onLargeFileGuidance,
    importResetKey,
}: MapImportToolbarProps) {
    const inputId = useId();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pmtilesBusyMessage, setPmtilesBusyMessage] = useState<string | null>(
        null,
    );
    const [hoverTip, setHoverTip] = useState<PmtilesHoverTip | null>(null);
    const [lastPmtilesSuccess, setLastPmtilesSuccess] = useState<{
        id: string;
        label: string;
        minZoom: number;
        maxZoom: number;
    } | null>(null);

    const maxMbRaw = Math.round(MAX_VECTOR_IMPORT_BYTES / 1024 / 1024);
    const maxMbPmtiles = Math.round(MAX_PMTILES_IMPORT_BYTES / 1024 / 1024);

    const hasVectorLayer = Boolean(activeFileName && featureCount !== null);
    const hasActiveImports =
        hasVectorLayer || pmtilesSummaries.length > 0;

    const hoverTipPlacement = useMemo(() => {
        if (!hoverTip) {
            return null;
        }
        return clampHoverTipPosition(hoverTip.clientX, hoverTip.clientY);
    }, [hoverTip]);

    function resetFileInput() {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    useEffect(() => {
        if (importResetKey === 0) {
            return;
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [importResetKey]);

    async function handlePmtilesFile(file: File) {
        const objectUrl = URL.createObjectURL(file);
        try {
            const pmtiles = new PMTiles(objectUrl);
            const header = await pmtiles.getHeader();
            if (header.tileType !== TileType.Mvt) {
                URL.revokeObjectURL(objectUrl);
                throw new VectorImportError(
                    "This PMTiles archive is not vector (MVT). Use a vector PMTiles file from tippecanoe or QGIS.",
                );
            }
            const id = crypto.randomUUID();
            const label = baseName(file.name);
            const layer = createPmtilesMvtLayer(id, pmtiles, {
                minZoom: header.minZoom,
                maxZoom: header.maxZoom,
                onHover: (info) => {
                    if (!info.object) {
                        setHoverTip(null);
                        return;
                    }
                    const { clientX, clientY } = pickToViewportPoint(info);
                    const o = info.object as { properties?: Record<string, unknown> };
                    const props = o.properties;
                    let text: string;
                    if (props && typeof props === "object") {
                        const keys = Object.keys(props).slice(0, 4);
                        text = keys
                            .map((k) => `${k}: ${String(props[k])}`)
                            .join(" · ");
                        if (!text) {
                            text = label;
                        }
                    } else {
                        text = label;
                    }
                    setHoverTip({ text, clientX, clientY });
                },
                onClick: onMvtPick,
            });

            const bbox: [[number, number], [number, number]] = [
                [header.minLon, header.minLat],
                [header.maxLon, header.maxLat],
            ];

            onPmtilesLayerReady({
                id,
                layer,
                objectUrl,
                bbox,
                minZoom: header.minZoom,
                maxZoom: header.maxZoom,
                label,
            });
            setLastPmtilesSuccess({
                id,
                label,
                minZoom: header.minZoom,
                maxZoom: header.maxZoom,
            });
        } catch (err) {
            URL.revokeObjectURL(objectUrl);
            throw err;
        }
    }

    async function handleFileList(files: FileList | null) {
        const file = files?.[0];
        if (!file) {
            return;
        }
        setError(null);
        setLastPmtilesSuccess(null);

        const ext = fileExtensionLower(file.name);

        if (ext === ".pmtiles") {
            if (file.size > MAX_PMTILES_IMPORT_BYTES) {
                onLargeFileGuidance({
                    fileName: file.name,
                    sizeMb: formatSizeMbOneDecimal(file.size),
                    variant: "pmtiles",
                });
                resetFileInput();
                return;
            }
            setBusy(true);
            setPmtilesBusyMessage("Loading PMTiles…");
            try {
                await handlePmtilesFile(file);
            } catch (err) {
                const message =
                    err instanceof VectorImportError
                        ? err.message
                        : "Could not read this PMTiles file.";
                setError(message);
            } finally {
                setBusy(false);
                setPmtilesBusyMessage(null);
                resetFileInput();
            }
            return;
        }

        if (file.size > MAX_VECTOR_IMPORT_BYTES) {
            onLargeFileGuidance({
                fileName: file.name,
                sizeMb: formatSizeMbOneDecimal(file.size),
                variant: "raw",
            });
            resetFileInput();
            return;
        }

        setBusy(true);
        try {
            const result = await parseVectorImportFile(file);
            onImported(result, file.name);
        } catch (err) {
            const message =
                err instanceof VectorImportError
                    ? err.message
                    : "Something went wrong while reading the file.";
            setError(message);
        } finally {
            setBusy(false);
            resetFileInput();
        }
    }

    const panelBody = (
        <>
            <input
                ref={fileInputRef}
                id={inputId}
                type="file"
                accept=".geojson,.json,.zip,.pmtiles,application/geo+json,application/json,application/x-sqlite3,application/vnd.pmtiles"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                    void handleFileList(e.target.files);
                }}
            />

            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--spatialx-text-muted)]">
                Vectors &amp; PMTiles
            </p>
            <p className="mt-1 text-[11px] leading-snug text-[var(--spatialx-text-muted)]">
                GeoJSON, shapefile ZIP, or vector{" "}
                <code className="rounded bg-[var(--spatialx-bg-muted)] px-1">
                    .pmtiles
                </code>
                . Stays in your browser.
            </p>

            <div className="mt-3 flex flex-col gap-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex w-full items-center justify-center gap-2 rounded-[100px] px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        busy
                            ? "bg-[var(--spatialx-bg-muted)] text-[var(--spatialx-text-muted)]"
                            : "bg-[var(--spatialx-green)] text-white hover:opacity-95"
                    }`}
                >
                    {busy ? (
                        <>
                            <span
                                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                                aria-hidden
                            />
                            {pmtilesBusyMessage ?? "Reading file…"}
                        </>
                    ) : (
                        <>
                            <UploadIcon className="opacity-95" />
                            Choose file
                        </>
                    )}
                </button>
                <p className="text-[10px] leading-snug text-[var(--spatialx-text-muted)]">
                    .geojson / .json / .zip · max {maxMbRaw} MB · .pmtiles · max{" "}
                    {maxMbPmtiles} MB
                </p>
            </div>

            {error ? (
                <div
                    className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900"
                    role="alert"
                >
                    <div className="flex items-start justify-between gap-2">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                            }}
                            className="shrink-0 rounded px-1 text-[11px] font-medium text-red-800 underline-offset-2 hover:underline"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            ) : null}

            {lastPmtilesSuccess ? (
                <div className="mt-3 border-t border-[var(--spatialx-border)] pt-3">
                    <p className="text-xs font-medium text-[var(--spatialx-text)]">
                        PMTiles layer added
                    </p>
                    <p
                        className="mt-0.5 truncate text-xs text-[var(--spatialx-text-muted)]"
                        title={lastPmtilesSuccess.label}
                    >
                        {lastPmtilesSuccess.label}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--spatialx-text-muted)]">
                        Zoom {lastPmtilesSuccess.minZoom}–
                        {lastPmtilesSuccess.maxZoom}
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                onPmtilesLayerRemoved(lastPmtilesSuccess.id);
                                setLastPmtilesSuccess(null);
                            }}
                            className={`w-full rounded-[100px] px-4 py-2 text-sm font-medium text-[var(--spatialx-text)] transition hover:border-zinc-400 ${hairline}`}
                        >
                            Remove layer
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLastPmtilesSuccess(null);
                                setHoverTip(null);
                            }}
                            className="w-full rounded-[100px] px-4 py-2 text-sm font-medium text-[var(--spatialx-text)] transition hover:opacity-90"
                            style={{ color: teal }}
                        >
                            Add another
                        </button>
                    </div>
                </div>
            ) : null}

            {pmtilesSummaries.length > 0 ? (
                <div className="mt-3 border-t border-[var(--spatialx-border)] pt-3">
                    <p className="text-xs font-medium text-[var(--spatialx-text)]">
                        Active PMTiles ({pmtilesSummaries.length})
                    </p>
                    <ul className="mt-2 max-h-28 space-y-1.5 overflow-y-auto sm:max-h-32">
                        {pmtilesSummaries.map((row) => (
                            <li
                                key={row.id}
                                className="flex items-center justify-between gap-2 text-[11px]"
                            >
                                <span
                                    className="min-w-0 flex-1 truncate text-[var(--spatialx-text-muted)]"
                                    title={row.label}
                                >
                                    {row.label}
                                    <span className="text-[var(--spatialx-text-muted)]/80">
                                        {" "}
                                        · z{row.minZoom}–{row.maxZoom}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onPmtilesLayerRemoved(row.id);
                                        setLastPmtilesSuccess((prev) =>
                                            prev?.id === row.id ? null : prev,
                                        );
                                    }}
                                    className="shrink-0 rounded px-2 py-0.5 text-[11px] font-medium hover:underline"
                                    style={{ color: teal }}
                                >
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            {hasVectorLayer ? (
                <div className="mt-3 border-t border-[var(--spatialx-border)] pt-3">
                    <p className="text-xs font-medium text-[var(--spatialx-text)]">
                        Active vector layer
                    </p>
                    <p
                        className="mt-0.5 truncate text-xs text-[var(--spatialx-text-muted)]"
                        title={activeFileName ?? undefined}
                    >
                        {activeFileName}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--spatialx-text-muted)]">
                        {(featureCount ?? 0).toLocaleString()}{" "}
                        {(featureCount ?? 0) === 1 ? "feature" : "features"}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            onClear();
                            setError(null);
                        }}
                        className={`mt-3 w-full rounded-[100px] px-4 py-2 text-sm font-medium text-[var(--spatialx-text)] transition hover:border-zinc-400 ${hairline}`}
                    >
                        Remove layer
                    </button>
                </div>
            ) : null}
        </>
    );

    return (
        <>
            {hoverTip && hoverTipPlacement ? (
                <div
                    className="pointer-events-none fixed z-[60] max-w-[min(18rem,calc(100vw-1.5rem))] rounded-md border border-[var(--spatialx-border)] bg-[var(--spatialx-surface)] px-2 py-1.5 text-[10px] leading-snug text-[var(--spatialx-text)] shadow-lg"
                    style={{
                        left: hoverTipPlacement.left,
                        top: hoverTipPlacement.top,
                        borderColor: `${teal}55`,
                    }}
                    aria-hidden
                >
                    {hoverTip.text}
                </div>
            ) : null}

            {panelOpen ? (
                <button
                    type="button"
                    className="pointer-events-auto fixed inset-0 z-[54] bg-black/35 backdrop-blur-[1px] sm:hidden"
                    aria-label="Close import panel"
                    onClick={() => {
                        setPanelOpen(false);
                    }}
                />
            ) : null}

            <div
                className={
                    panelOpen
                        ? "pointer-events-auto fixed inset-x-0 bottom-0 z-[55] flex max-h-[min(72dvh,100%-4rem)] flex-col rounded-t-2xl border border-b-0 border-[var(--spatialx-border)] bg-[var(--spatialx-surface)] pt-1 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] sm:absolute sm:inset-auto sm:bottom-auto sm:left-4 sm:top-4 sm:max-h-[min(calc(100dvh-2rem),44rem)] sm:w-[min(19rem,calc(100vw-2rem))] sm:rounded-xl sm:border sm:pt-0 sm:shadow-lg"
                        : "pointer-events-auto absolute bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-4 z-[55] sm:bottom-auto sm:top-4"
                }
            >
                {!panelOpen ? (
                    <button
                        type="button"
                        onClick={() => {
                            setPanelOpen(true);
                        }}
                        className={`flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-medium text-[var(--spatialx-text)] shadow-lg transition hover:opacity-95 ${hairline}`}
                        aria-expanded={false}
                        aria-controls={`${inputId}-panel`}
                    >
                        <UploadIcon className="text-[var(--spatialx-green)]" />
                        <span>Import</span>
                        {hasActiveImports ? (
                            <span
                                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--spatialx-green)] px-1 text-[10px] font-semibold text-white"
                                aria-label="Active imports on map"
                            >
                                {(hasVectorLayer ? 1 : 0) +
                                    pmtilesSummaries.length}
                            </span>
                        ) : null}
                    </button>
                ) : (
                    <div
                        id={`${inputId}-panel`}
                        role="region"
                        aria-label="Import data"
                        className="flex min-h-0 flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 sm:p-4"
                    >
                        <div className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-[var(--spatialx-border)] sm:hidden" />

                        <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
                            <h2 className="text-sm font-semibold text-[var(--spatialx-green-ink)]">
                                Import
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setPanelOpen(false);
                                }}
                                className="rounded-full p-1.5 text-[var(--spatialx-text-muted)] transition hover:bg-[var(--spatialx-bg-muted)] hover:text-[var(--spatialx-text)]"
                                aria-label="Close import panel"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            {panelBody}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
