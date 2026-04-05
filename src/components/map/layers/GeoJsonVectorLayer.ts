import type { PickingInfo } from "@deck.gl/core";
import { GeoJsonLayer } from "@deck.gl/layers";

import type {
    GeoJsonFeature,
    GeoJsonFeatureCollection,
} from "@/types/geoJsonVector";

export type { GeoJsonFeature, GeoJsonFeatureCollection };

export type GeoJsonVectorLayerHandlers = {
    onClick?: (info: PickingInfo) => void;
    onHover?: (info: PickingInfo) => void;
};

export type CreateGeoJsonVectorLayerOptions = GeoJsonVectorLayerHandlers & {
    id?: string;
};

/**
 * GPU-backed GeoJSON with Deck.gl picking. Pass a stable `onClick` (e.g. from
 * `useCallback`) when layers are memoized so handler identity does not churn layers.
 */
export function createGeoJsonVectorLayer(
    data: GeoJsonFeatureCollection,
    options: CreateGeoJsonVectorLayerOptions = {},
): GeoJsonLayer {
    const { id = "geojson-vector", onClick, onHover } = options;

    return new GeoJsonLayer({
        id,
        data,
        pickable: true,
        stroked: true,
        filled: true,
        getFillColor: [29, 158, 117, 120],
        getLineColor: [8, 80, 65, 255],
        lineWidthMinPixels: 2,
        onClick,
        onHover,
    });
}
