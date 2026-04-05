import bbox from "@turf/bbox";

import type { GeoJsonFeatureCollection } from "@/types/geoJsonVector";

/**
 * Web Mercator–safe bounds for `map.fitBounds`, with a small pad for points and thin lines.
 */
export function getLngLatBoundsForFeatureCollection(
    fc: GeoJsonFeatureCollection,
): [[number, number], [number, number]] | null {
    const b = bbox(fc as never);
    if (!b.every((n) => Number.isFinite(n))) {
        return null;
    }
    const [w, s, e, n] = b as [number, number, number, number];
    const pad = 0.001;
    let west = w;
    let south = s;
    let east = e;
    let north = n;
    const thinLng = Math.abs(east - west) < 1e-8;
    const thinLat = Math.abs(north - south) < 1e-8;
    if (thinLng || thinLat) {
        west -= pad;
        south -= pad;
        east += pad;
        north += pad;
    }
    return [
        [west, south],
        [east, north],
    ];
}
