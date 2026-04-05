"use client";

import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Layer } from "@deck.gl/core";
import { useEffect } from "react";
import { useControl } from "react-map-gl/maplibre";

type DeckGLOverlayControlProps = {
    layers: Layer[];
};

/**
 * Deck.gl layers interleaved with MapLibre for GPU picking on vector data.
 */
export function DeckGLOverlayControl({ layers }: DeckGLOverlayControlProps) {
    const overlay = useControl(
        () =>
            new MapboxOverlay({
                interleaved: true,
                layers: [],
            }),
    );

    useEffect(() => {
        overlay.setProps({ layers });
    }, [overlay, layers]);

    return null;
}
