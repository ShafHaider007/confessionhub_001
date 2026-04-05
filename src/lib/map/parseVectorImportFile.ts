import shp from "shpjs";

import {
    importableGeoJsonSchema,
    toFeatureCollection,
} from "@/schemas/geoJsonImportSchema";
import type {
    GeoJsonFeature,
    GeoJsonFeatureCollection,
} from "@/types/geoJsonVector";

import { MAX_VECTOR_IMPORT_BYTES } from "@/lib/map/vectorImportLimits";

export { MAX_VECTOR_IMPORT_BYTES } from "@/lib/map/vectorImportLimits";

export class VectorImportError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "VectorImportError";
    }
}

export type ParsedVectorImport = {
    collection: GeoJsonFeatureCollection;
    format: "geojson" | "shapefile";
};

function normalizeShpResult(raw: unknown): GeoJsonFeatureCollection {
    if (raw == null) {
        throw new VectorImportError("Shapefile produced no data.");
    }
    if (Array.isArray(raw)) {
        if (raw.length === 0) {
            throw new VectorImportError("Shapefile produced no layers.");
        }
        const features: GeoJsonFeature[] = [];
        for (const item of raw) {
            if (
                item &&
                typeof item === "object" &&
                (item as { type?: string }).type === "FeatureCollection" &&
                Array.isArray((item as GeoJsonFeatureCollection).features)
            ) {
                features.push(...(item as GeoJsonFeatureCollection).features);
            } else if (
                item &&
                typeof item === "object" &&
                (item as { type?: string }).type === "Feature"
            ) {
                features.push(item as GeoJsonFeature);
            }
        }
        if (features.length === 0) {
            throw new VectorImportError("Shapefile layers were empty.");
        }
        return { type: "FeatureCollection", features };
    }
    if (
        typeof raw === "object" &&
        (raw as { type?: string }).type === "FeatureCollection"
    ) {
        const fc = raw as GeoJsonFeatureCollection;
        if (!Array.isArray(fc.features) || fc.features.length === 0) {
            throw new VectorImportError("Shapefile produced no features.");
        }
        return fc;
    }
    throw new VectorImportError("Unexpected shapefile output.");
}

/**
 * Parse a user-selected vector file in the browser (GeoJSON / JSON or zipped shapefile).
 */
export async function parseVectorImportFile(
    file: File,
): Promise<ParsedVectorImport> {
    if (file.size === 0) {
        throw new VectorImportError("This file is empty.");
    }
    if (file.size > MAX_VECTOR_IMPORT_BYTES) {
        const mb = Math.round(MAX_VECTOR_IMPORT_BYTES / 1024 / 1024);
        throw new VectorImportError(`File is too large (maximum ${mb} MB).`);
    }

    const lower = file.name.toLowerCase();
    const dot = lower.lastIndexOf(".");
    const ext = dot >= 0 ? lower.slice(dot) : "";

    if (ext === ".zip") {
        const buffer = await file.arrayBuffer();
        let raw: unknown;
        try {
            raw = await shp(buffer);
        } catch {
            throw new VectorImportError(
                "Could not read this ZIP as a shapefile. Use a single archive that includes .shp, .dbf, and usually .shx (as from “Package for download”).",
            );
        }
        const collection = normalizeShpResult(raw);
        return { collection, format: "shapefile" };
    }

    if (ext === ".geojson" || ext === ".json") {
        let json: unknown;
        try {
            json = JSON.parse(await file.text());
        } catch {
            throw new VectorImportError("File is not valid JSON.");
        }
        const parsed = importableGeoJsonSchema.safeParse(json);
        if (!parsed.success) {
            throw new VectorImportError(
                "Not valid GeoJSON. Expected a Feature or FeatureCollection.",
            );
        }
        const collection = toFeatureCollection(parsed.data);
        if (collection.features.length === 0) {
            throw new VectorImportError("GeoJSON contains no features.");
        }
        return { collection, format: "geojson" };
    }

    throw new VectorImportError(
        "Unsupported format. Use .geojson, .json, or a shapefile .zip.",
    );
}
