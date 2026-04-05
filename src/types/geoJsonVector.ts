/** Minimal GeoJSON Feature / FeatureCollection (map layers + client import). */

export type GeoJsonFeature = {
    type: "Feature";
    geometry: { type: string; [key: string]: unknown };
    properties?: Record<string, unknown> | null;
    id?: string | number;
};

export type GeoJsonFeatureCollection = {
    type: "FeatureCollection";
    features: GeoJsonFeature[];
};
