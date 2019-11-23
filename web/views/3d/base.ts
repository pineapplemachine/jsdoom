import {MapGeometryBuilder, MapGeometry} from "@src/convert/3DMapBuilder";
import * as lumps from "@src/lumps/index";
import {WADLump} from "@src/wad/lump";

// This function will make the builder build the map in 3D
export function ConvertMapToGeometry(lump: WADLump): MapGeometry | null {
    // Initialize map
    const mapLump: (WADLump | null) = lumps.WADMap.findMarker(lump);
    if(!mapLump){
        return null;
    }
    const map = lumps.WADMap.from(mapLump);
    // Build map mesh
    const mapBuilder = new MapGeometryBuilder(map);
    return mapBuilder.rebuild();
}
