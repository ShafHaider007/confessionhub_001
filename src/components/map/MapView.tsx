"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type { Layer, PickingInfo } from "@deck.gl/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapLibreEvent } from "maplibre-gl";
import Map, { NavigationControl, type MapRef } from "react-map-gl/maplibre";

import { getLngLatBoundsForFeatureCollection } from "@/lib/map/fitMapToFeatureCollection";
import type { ParsedVectorImport } from "@/lib/map/parseVectorImportFile";
import type { GeoJsonFeature } from "@/types/geoJsonVector";

import {
    AttributePanel,
    type AttributePanelAnchor,
    type AttributePanelSelection,
} from "./AttributePanel";
import {
    LargeFileGuidancePanel,
    type LargeFileGuidancePayload,
} from "./LargeFileGuidancePanel";
import { DeckGLOverlayControl } from "./DeckGLOverlayControl";
import {
    createGeoJsonVectorLayer,
    type GeoJsonFeatureCollection,
} from "./layers/GeoJsonVectorLayer";
import type { PMTilesMVTLayer } from "./layers/PMTilesMVTLayer";
import {
    MapImportToolbar,
    type PmtilesLayerReadyPayload,
    type PmtilesLayerSummary,
} from "./MapImportToolbar";

const ESRI_ATTRIBUTION =
    "Esri, Maxar, Earthstar Geographics, GIS User Community";

const INITIAL_VIEW = {
    longitude: 73.0479,
    latitude: 33.6844,
    zoom: 11,
};

const MAP_STYLE = {
    version: 8 as const,
    sources: {
        "esri-imagery": {
            type: "raster" as const,
            tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: ESRI_ATTRIBUTION,
        },
    },
    layers: [
        {
            id: "esri-imagery",
            type: "raster" as const,
            source: "esri-imagery",
        },
    ],
};

function pickingToSelection(info: PickingInfo): AttributePanelSelection {
    const obj = info.object as unknown;
    if (!obj || typeof obj !== "object") {
        return null;
    }
    const feature = obj as Partial<GeoJsonFeature>;
    if (feature.type !== "Feature") {
        return null;
    }
    const geom = feature.geometry;
    const geometryType =
        geom && typeof geom === "object" && "type" in geom && typeof geom.type === "string"
            ? geom.type
            : undefined;
    const raw = feature.properties;
    const properties =
        raw != null && typeof raw === "object" && !Array.isArray(raw)
            ? { ...raw }
            : {};

    return {
        id: feature.id,
        properties,
        geometryType,
    };
}

type PmtilesEntry = {
    id: string;
    layer: PMTilesMVTLayer;
    objectUrl: string;
    bbox: [[number, number], [number, number]];
    label: string;
    minZoom: number;
    maxZoom: number;
};

type AttributePanelState = {
    selection: Exclude<AttributePanelSelection, null>;
    anchor: AttributePanelAnchor;
};

export default function MapView() {
    const mapRef = useRef<MapRef>(null);
    const [mapReady, setMapReady] = useState(false);
    const [importedLayer, setImportedLayer] = useState<{
        data: GeoJsonFeatureCollection;
        fileName: string;
    } | null>(null);
    const [pmtilesEntries, setPmtilesEntries] = useState<PmtilesEntry[]>([]);
    const [attributePanel, setAttributePanel] =
        useState<AttributePanelState | null>(null);
    const [largeFileGuidance, setLargeFileGuidance] =
        useState<LargeFileGuidancePayload | null>(null);
    const [importResetKey, setImportResetKey] = useState(0);

    const handleVectorPick = useCallback((info: PickingInfo) => {
        if (!info.object) {
            setAttributePanel(null);
            return;
        }
        const selection = pickingToSelection(info);
        if (!selection) {
            setAttributePanel(null);
            return;
        }
        const root =
            typeof document !== "undefined"
                ? document.querySelector("[data-spatialx-map-root]")
                : null;
        const canvas = root?.querySelector(
            "canvas.maplibregl-canvas",
        ) as HTMLCanvasElement | null;
        const canvasRect = canvas?.getBoundingClientRect();
        const clientX = canvasRect ? canvasRect.left + info.x : info.x;
        const clientY = canvasRect ? canvasRect.top + info.y : info.y;
        setAttributePanel({
            selection,
            anchor: { clientX, clientY },
        });
    }, []);

    const dismissLargeFileGuidance = useCallback(() => {
        setLargeFileGuidance(null);
        setImportResetKey((k) => k + 1);
    }, []);

    const onLargeFileGuidance = useCallback(
        (payload: LargeFileGuidancePayload) => {
            setLargeFileGuidance(payload);
        },
        [],
    );

    const deckLayers = useMemo((): Layer[] => {
        const pmtiles: Layer[] = pmtilesEntries.map((e) => e.layer);
        if (!importedLayer) {
            return pmtiles;
        }
        const geo = createGeoJsonVectorLayer(importedLayer.data, {
            onClick: handleVectorPick,
        });
        /* GeoJSON above PMTiles so clicks hit imported vectors first. */
        return [...pmtiles, geo];
    }, [pmtilesEntries, importedLayer, handleVectorPick]);

    const onImported = useCallback(
        (result: ParsedVectorImport, fileName: string) => {
            setImportedLayer({ data: result.collection, fileName });
            setAttributePanel(null);
        },
        [],
    );

    const onClearImport = useCallback(() => {
        setImportedLayer(null);
        setAttributePanel(null);
    }, []);

    const onPmtilesLayerReady = useCallback((payload: PmtilesLayerReadyPayload) => {
        setPmtilesEntries((prev) => [
            ...prev,
            {
                id: payload.id,
                layer: payload.layer,
                objectUrl: payload.objectUrl,
                bbox: payload.bbox,
                label: payload.label,
                minZoom: payload.minZoom,
                maxZoom: payload.maxZoom,
            },
        ]);
        setAttributePanel(null);
    }, []);

    const onPmtilesLayerRemoved = useCallback((id: string) => {
        setPmtilesEntries((prev) => {
            const entry = prev.find((e) => e.id === id);
            if (entry) {
                URL.revokeObjectURL(entry.objectUrl);
            }
            return prev.filter((e) => e.id !== id);
        });
        setAttributePanel(null);
    }, []);

    useEffect(() => {
        return () => {
            setPmtilesEntries((prev) => {
                for (const e of prev) {
                    URL.revokeObjectURL(e.objectUrl);
                }
                return [];
            });
        };
    }, []);

    useEffect(() => {
        if (!importedLayer || !mapReady || !mapRef.current) {
            return;
        }
        const map = mapRef.current.getMap();
        const bounds = getLngLatBoundsForFeatureCollection(
            importedLayer.data,
        );
        if (!bounds) {
            return;
        }
        map.fitBounds(bounds, {
            padding: 56,
            maxZoom: 15,
            duration: 650,
        });
    }, [importedLayer, mapReady]);

    const lastPmtilesFitRef = useRef<string | null>(null);
    useEffect(() => {
        const last = pmtilesEntries[pmtilesEntries.length - 1];
        if (!last || !mapReady || !mapRef.current) {
            return;
        }
        if (lastPmtilesFitRef.current === last.id) {
            return;
        }
        lastPmtilesFitRef.current = last.id;
        const map = mapRef.current.getMap();
        map.fitBounds(last.bbox, {
            padding: 40,
            maxZoom: Math.min(last.maxZoom + 1, 18),
            duration: 650,
        });
    }, [pmtilesEntries, mapReady]);

    const onLoad = useCallback((evt: MapLibreEvent) => {
        const m = evt.target;
        requestAnimationFrame(() => {
            m.resize();
            setMapReady(true);
        });
    }, []);

    const pmtilesSummaries: PmtilesLayerSummary[] = useMemo(
        () =>
            pmtilesEntries.map((e) => ({
                id: e.id,
                label: e.label,
                minZoom: e.minZoom,
                maxZoom: e.maxZoom,
            })),
        [pmtilesEntries],
    );

    return (
        <div className="relative h-full w-full" data-spatialx-map-root>
            <Map
                ref={mapRef}
                initialViewState={INITIAL_VIEW}
                mapStyle={MAP_STYLE}
                style={{ width: "100%", height: "100%" }}
                reuseMaps={false}
                onLoad={onLoad}
            >
                <NavigationControl position="top-right" />
                <DeckGLOverlayControl layers={deckLayers} />
            </Map>

            {largeFileGuidance ? (
                <LargeFileGuidancePanel
                    fileName={largeFileGuidance.fileName}
                    sizeMb={largeFileGuidance.sizeMb}
                    variant={largeFileGuidance.variant}
                    onChooseDifferentFile={dismissLargeFileGuidance}
                />
            ) : null}

            <MapImportToolbar
                onImported={onImported}
                onClear={onClearImport}
                activeFileName={importedLayer?.fileName ?? null}
                featureCount={
                    importedLayer ? importedLayer.data.features.length : null
                }
                onPmtilesLayerReady={onPmtilesLayerReady}
                onPmtilesLayerRemoved={onPmtilesLayerRemoved}
                pmtilesSummaries={pmtilesSummaries}
                onMvtPick={handleVectorPick}
                onLargeFileGuidance={onLargeFileGuidance}
                importResetKey={importResetKey}
            />

            {attributePanel ? (
                <AttributePanel
                    selected={attributePanel.selection}
                    anchor={attributePanel.anchor}
                    onClose={() => {
                        setAttributePanel(null);
                    }}
                />
            ) : null}
        </div>
    );
}
