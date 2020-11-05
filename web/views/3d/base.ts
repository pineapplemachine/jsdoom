import {MapGeometryBuilder, MapGeometry} from "@src/convert/3DMapBuilder";
import {WADMap} from "@src/lumps/doom/map";

// This function will make the builder build the map in 3D
export async function ConvertMapToGeometry(map: WADMap): Promise<MapGeometry> {
    // Build map mesh
    const mapBuilder = new MapGeometryBuilder(map);
    return mapBuilder.rebuild();
}
