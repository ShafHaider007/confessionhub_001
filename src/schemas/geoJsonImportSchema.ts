import { z } from "zod";

import type { GeoJsonFeatureCollection } from "@/types/geoJsonVector";

const geometrySchema = z
    .object({
        type: z.string(),
    })
    .passthrough();

export const geoJsonFeatureSchema = z.object({
    type: z.literal("Feature"),
    geometry: geometrySchema,
    properties: z
        .union([z.record(z.string(), z.unknown()), z.null()])
        .optional(),
    id: z.union([z.string(), z.number()]).optional(),
});

export const importableGeoJsonSchema = z.union([
    z.object({
        type: z.literal("FeatureCollection"),
        features: z.array(geoJsonFeatureSchema),
    }),
    geoJsonFeatureSchema,
]);

export type ImportableGeoJson = z.infer<typeof importableGeoJsonSchema>;

export function toFeatureCollection(
    data: ImportableGeoJson,
): GeoJsonFeatureCollection {
    if (data.type === "Feature") {
        return { type: "FeatureCollection", features: [data] };
    }
    return data;
}
