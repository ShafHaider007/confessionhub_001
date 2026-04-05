declare module "shpjs" {
    /** Parses a shapefile buffer or a zipped shapefile (ArrayBuffer). */
    function shp(buffer: ArrayBuffer): Promise<unknown>;
    export default shp;
}
