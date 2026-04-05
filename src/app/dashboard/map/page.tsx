"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map/MapView"), {
    ssr: false,
    loading: () => (
        <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center bg-[var(--spatialx-bg-muted)] text-base font-light text-[var(--spatialx-text-muted)]">
            Loading map…
        </div>
    ),
});

export default function DashboardMapPage() {
    /* Explicit height: flex parents with min-height only do not give %/h-full children a real box (map was 0px tall). */
    return (
        <div className="h-[calc(100dvh-4rem)] w-full min-w-0 shrink-0">
            <MapView />
        </div>
    );
}
