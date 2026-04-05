import { MVTLayer } from "@deck.gl/geo-layers";
import { load } from "@loaders.gl/core";
import { MVTLoader } from "@loaders.gl/mvt";
import type { PMTiles } from "pmtiles";

type MvtTileLoadProps = {
    index: { x: number; y: number; z: number };
    signal?: AbortSignal;
};

/**
 * Dummy template so MVTLayer's TileLayer keeps a non-null `data` URL template.
 * Tile bytes always come from {@link PMTilesMVTLayerProps.pmtiles} via getTileData.
 */
const PMTILES_LAYER_DATA_TEMPLATE =
    "https://spatialx.local/tiles/{z}/{x}/{y}.mvt";

export type PMTilesMVTLayerProps = ConstructorParameters<typeof MVTLayer>[0] & {
    /** Tile archive; not a standard MVTLayer prop — read in {@link PMTilesMVTLayer.getTileData}. */
    pmtiles: PMTiles;
};

/**
 * MVT tiles read from a local or remote PMTiles archive (browser File / blob URL).
 */
export class PMTilesMVTLayer extends MVTLayer {
    static layerName = "PMTilesMVTLayer";

    declare state: MVTLayer["state"];

    getTileData(loadProps: MvtTileLoadProps) {
        const pmtiles = (this.props as unknown as PMTilesMVTLayerProps).pmtiles;
        const { index, signal } = loadProps;
        const binary = this.state.binary;

        return (async () => {
            const res = await pmtiles.getZxy(index.z, index.x, index.y, signal);
            if (!res?.data || res.data.byteLength === 0) {
                return null;
            }
            const loadOptions = {
                mvt: {
                    coordinates: this.context.viewport.resolution
                        ? ("wgs84" as const)
                        : ("local" as const),
                    tileIndex: index,
                },
                gis: binary ? { format: "binary" as const } : {},
            };
            return load(res.data, MVTLoader, loadOptions);
        })();
    }
}

export function createPmtilesMvtLayer(
    id: string,
    pmtiles: PMTiles,
    options: {
        minZoom?: number;
        maxZoom?: number;
        onHover?: PMTilesMVTLayerProps["onHover"];
        onClick?: PMTilesMVTLayerProps["onClick"];
    } = {},
): PMTilesMVTLayer {
    const { minZoom, maxZoom, onHover, onClick } = options;

    return new PMTilesMVTLayer({
        id,
        data: PMTILES_LAYER_DATA_TEMPLATE,
        pmtiles,
        minZoom: minZoom ?? 0,
        maxZoom: maxZoom ?? 22,
        pickable: true,
        filled: true,
        stroked: true,
        getFillColor: [19, 175, 159, 40],
        getLineColor: [19, 175, 159, 220],
        lineWidthMinPixels: 1,
        getPointRadius: 4,
        pointRadiusMinPixels: 5,
        pointRadiusMaxPixels: 32,
        onHover,
        onClick,
    } as ConstructorParameters<typeof PMTilesMVTLayer>[0]);
}
