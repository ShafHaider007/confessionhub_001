"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback } from "react";
import type { MapLibreEvent } from "maplibre-gl";
import Map, { NavigationControl } from "react-map-gl/maplibre";

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

export default function MapView() {
    const onLoad = useCallback((evt: MapLibreEvent) => {
        const m = evt.target;
        requestAnimationFrame(() => {
            m.resize();
        });
    }, []);

    return (
        <div className="relative h-full w-full">
            <Map
                initialViewState={INITIAL_VIEW}
                mapStyle={MAP_STYLE}
                style={{ width: "100%", height: "100%" }}
                reuseMaps={false}
                onLoad={onLoad}
            >
                <NavigationControl position="top-right" />
            </Map>
        </div>
    );
}
