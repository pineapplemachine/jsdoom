import {MapGeometryBuilder, MapGeometry} from "@src/convert/3DMapBuilder";
import * as lumps from "@src/lumps/index";
import {WADLump} from "@src/wad/lump";

// This function will make the builder build the map in 3D
export async function ConvertMapToGeometry(lump: WADLump): Promise<MapGeometry> {
    // Initialize map
    const mapLump: (WADLump | null) = lumps.WADMap.findMarker(lump);
    if(!mapLump){
        return Promise.reject("No map lump available!");
    }
    const map = lumps.WADMap.from(mapLump);
    // Build map mesh
    const mapBuilder = new MapGeometryBuilder(map);
    return mapBuilder.rebuild();
}
