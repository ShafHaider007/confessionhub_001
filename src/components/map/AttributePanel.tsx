"use client";

import { useMemo } from "react";

export type AttributePanelSelection = {
    id?: string | number;
    properties: Record<string, unknown>;
    geometryType?: string;
} | null;

/** Viewport pixels where the user clicked (for anchoring the panel). */
export type AttributePanelAnchor = {
    clientX: number;
    clientY: number;
};

type AttributePanelProps = {
    selected: Exclude<AttributePanelSelection, null>;
    anchor: AttributePanelAnchor;
    onClose: () => void;
};

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

/** Space reserved at top of viewport (dashboard header ~4rem + breathing room). */
const VIEWPORT_TOP_RESERVE_PX = 72;
const PANEL_MARGIN_PX = 10;
/** Max panel width in px (matches `w-[20rem]`). */
const PANEL_EST_WIDTH_PX = 320;

function clampPanelPosition(clientX: number, clientY: number) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 800;
    const vh = typeof window !== "undefined" ? window.innerHeight : 600;
    const estHeight = Math.min(vh * 0.5, 352);

    let left = clientX + PANEL_MARGIN_PX;
    let top = clientY + PANEL_MARGIN_PX;

    if (left + PANEL_EST_WIDTH_PX > vw - PANEL_MARGIN_PX) {
        left = clientX - PANEL_EST_WIDTH_PX - PANEL_MARGIN_PX;
    }
    if (left < PANEL_MARGIN_PX) {
        left = PANEL_MARGIN_PX;
    }

    if (top + estHeight > vh - PANEL_MARGIN_PX) {
        top = clientY - estHeight - PANEL_MARGIN_PX;
    }
    if (top < VIEWPORT_TOP_RESERVE_PX) {
        top = VIEWPORT_TOP_RESERVE_PX;
    }
    if (top + estHeight > vh - PANEL_MARGIN_PX) {
        top = Math.max(VIEWPORT_TOP_RESERVE_PX, vh - estHeight - PANEL_MARGIN_PX);
    }

    return { left, top };
}

export function AttributePanel({
    selected,
    anchor,
    onClose,
}: AttributePanelProps) {
    const { left, top } = useMemo(
        () => clampPanelPosition(anchor.clientX, anchor.clientY),
        [anchor.clientX, anchor.clientY],
    );

    const entries = Object.entries(selected.properties).sort(([a], [b]) =>
        a.localeCompare(b),
    );

    return (
        <aside
            className="pointer-events-auto fixed z-[60] flex max-h-[min(50vh,22rem)] w-[min(calc(100vw-1.5rem),20rem)] flex-col rounded-lg border border-[var(--spatialx-border)] bg-[var(--spatialx-surface)] text-[var(--spatialx-text)] shadow-lg"
            style={{ left, top }}
            aria-label="Feature attributes"
        >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--spatialx-border)] px-3 py-2">
                <h2 className="text-sm font-semibold text-[var(--spatialx-green-ink)]">
                    Attributes
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md px-2 py-1 text-xs font-medium text-[var(--spatialx-text-muted)] hover:bg-[var(--spatialx-green-fill)] hover:text-[var(--spatialx-green-ink)]"
                >
                    Dismiss
                </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 text-sm">
                {selected.geometryType ? (
                    <p className="mb-2 text-xs text-[var(--spatialx-text-muted)]">
                        Geometry:{" "}
                        <span className="font-mono text-[var(--spatialx-text)]">
                            {selected.geometryType}
                        </span>
                    </p>
                ) : null}
                {selected.id !== undefined && selected.id !== null ? (
                    <p className="mb-2 text-xs text-[var(--spatialx-text-muted)]">
                        id:{" "}
                        <span className="font-mono text-[var(--spatialx-text)]">
                            {String(selected.id)}
                        </span>
                    </p>
                ) : null}
                {entries.length === 0 ? (
                    <p className="text-[var(--spatialx-text-muted)]">
                        No properties on this feature.
                    </p>
                ) : (
                    <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-x-2 gap-y-1">
                        {entries.map(([key, value]) => (
                            <div
                                key={key}
                                className="contents"
                            >
                                <dt className="break-words font-medium text-[var(--spatialx-text-muted)]">
                                    {key}
                                </dt>
                                <dd className="break-all font-mono text-xs text-[var(--spatialx-text)]">
                                    {formatValue(value)}
                                </dd>
                            </div>
                        ))}
                    </dl>
                )}
            </div>
        </aside>
    );
}
