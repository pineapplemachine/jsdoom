import {WADLump} from "@src/wad/lump";

import {WADMapFormat} from "./mapFormat";
import {WADMapLines, WADMapLine} from "./mapLines";
import {WADMapSectors, WADMapSector} from "./mapSectors";
import {WADMapSides, WADMapSide} from "./mapSides";
import {WADMapThings, WADMapThing} from "./mapThings";
import {WADMapThingClass, WADMapThingTypeMap} from "./mapThingType";
import {WADMapVertexes, WADMapVertex, WADMapBoundingBox} from "./mapVertexes";

// Data structure which wraps several lumps together
// making up a single map.
export class WADMap {
    // The name of the map marker lump.
    name: string;
    // Represents the map's THINGS lump.
    things: (WADMapThings | null);
    // Represents the map's LINEDEFS lump.
    lines: (WADMapLines | null);
    // Represents the map's SIDEDEFS lump.
    sides: (WADMapSides | null);
    // Represents the map's VERTEXES lump.
    vertexes: (WADMapVertexes | null);
    // Represents the map's SEGS (segments) lump.
    segments: (WADLump | null);
    // Represents the map's SSECTORS (subsectors) lump.
    subsectors: (WADLump | null);
    // Represents the map's NODES lump.
    nodes: (WADLump | null);
    // Represents the map's SECTORS lump.
    sectors: (WADMapSectors | null);
    // Represents the map's REJECT lump.
    reject: (WADLump | null);
    // Represents the map's BLOCKMAP lump.
    blockmap: (WADLump | null);
    // Represents the map's BEHAVIOR lump. (Hexen, ZDoom)
    behavior: (WADLump | null);
    // The map's format
    format: WADMapFormat;
    // Some maps, like the ones in GZDoom PK3s, and the IWAD for Doom 64 EX,
    // are in self-contained WADs.
    selfContained: boolean;
    
    constructor(name: string) {
        this.name = name;
        this.things = null;
        this.lines = null;
        this.sides = null;
        this.vertexes = null;
        this.segments = null;
        this.subsectors = null;
        this.nodes = null;
        this.sectors = null;
        this.reject = null;
        this.blockmap = null;
        this.behavior = null;
        this.format = WADMapFormat.Doom;
        this.selfContained = false;
    }
    
    // Returns true when a WADLump is a map marker.
    // Returns false otherwise.
    // This function is slightly more permissive than vanilla
    // Doom 1 & 2.
    // TODO: Should this function look for a MAPINFO lump and
    // use that to find additional map marker names?
    static match(lump: WADLump): boolean {
        if(lump.length !== 0){
            return false;
        }
        const name: string = lump.name.toUpperCase();
        return (
            // MAPxx
            (name.length >= 5 && name.startsWith("MAP")) ||
            // ExMx
            (name.length >= 4 && name[0] === "E" && name[2] === "M")
        );
    }
    
    // Find the map marker lump corresponding to some map related lump,
    // for example given the "THINGS" or "LINEDEFS" lump as input.
    // May behave unexpectedly for inputs that are not actually map-related.
    // Returns null if no corresponding map marker could be found.
    static findMarker(mapLump: WADLump): (WADLump | null) {
        if(WADMap.match(mapLump)){
            return mapLump;
        }
        for(const lump of mapLump.enumeratePreviousLumps()){
            if(WADMap.match(lump)){
                return lump;
            }
        }
        return null;
    }
    
    // Create a WADMapVertexes given a WADLump object.
    // The WADLump must be the map marker lump.
    // The function will look for THINGS, LINEDEFS, etc. lumps in between
    // this map marker and the next lump not recognized as belonging to
    // the map.
    static from(markerLump: WADLump): WADMap {
        const map: WADMap = new WADMap(markerLump.name);
        for(const lump of markerLump.enumerateNextLumps()){
            const name: string = lump.name.toUpperCase();
            if(name === WADMapThings.LumpName){ // THINGS
                map.things = WADMapThings.from(lump);
            }else if(name === WADMapLines.LumpName){ // LINEDEFS
                map.lines = WADMapLines.from(lump);
            }else if(name === WADMapSides.LumpName){ // SIDEDEFS
                map.sides = WADMapSides.from(lump);
            }else if(name === WADMapVertexes.LumpName){ // VERTEXES
                map.vertexes = WADMapVertexes.from(lump);
            }else if(name === "SEGS"){ // SEGS
                map.segments = lump;
            }else if(name === "SSECTORS"){ // SSECTORS
                map.subsectors = lump;
            }else if(name === "NODES"){ // NODES
                map.nodes = lump;
            }else if(name === WADMapSectors.LumpName){ // SECTORS
                map.sectors = WADMapSectors.from(lump);
            }else if(name === "REJECT"){ // REJECT
                map.reject = lump;
            }else if(name === "BLOCKMAP"){ // BLOCKMAP
                map.blockmap = lump;
            }else if(name === "BEHAVIOR"){ // BEHAVIOR (Hexen, ZDoom)
                map.behavior = lump;
                // ZDoom/UDMF maps can also have BEHAVIOR and/or SCRIPTS lumps.
                if(map.format !== WADMapFormat.UDMF){
                    map.format = WADMapFormat.Hexen;
                }
            }else if(name === "TEXTMAP"){ // TEXTMAP (ZDoom)
                // TODO: Load UDMF maps
                // TEXTMAP and ZNODES are only present on UDMF maps
                map.format = WADMapFormat.UDMF;
            }else if(name === "ZNODES"){ // ZNODES (ZDoom)
                // TODO: Load UDMF maps
                map.format = WADMapFormat.UDMF;
            }else if(name === "DIALOGUE"){ // DIALOGUE (ZDoom)
                // TODO: Load UDMF maps
                map.format = WADMapFormat.UDMF;
            }else if(name === "LEAFS"){ // LEAFS (Doom PSX/64)
                map.format = WADMapFormat.DoomPSX;
            }else if(name === "LIGHTS"){ // LIGHTS (Doom 64)
                map.format = WADMapFormat.Doom64;
            }else if(name === "MACROS"){ // MACROS (Doom 64)
                map.format = WADMapFormat.Doom64;
            }else{ // Exit upon seeing anything else (including ENDMAP)
                break;
            }
        }
        map.setFormat(map.format);
        return map;
    }
    
    // Get the minimum and maximum X and Y vertex coordinates,
    // i.e. a minimum bounding box.
    // Returns an empty bounding box centered on the origin if there
    // were no vertexes in the map.
    getBoundingBox(): WADMapBoundingBox {
        if(!this.vertexes){
            return new WADMapBoundingBox(0, 0, 0, 0);
        }else{
            return this.vertexes.getBoundingBox();
        }
    }
    
    // Enumerate all linedefs in the map.
    enumerateThings(): Iterable<WADMapThing> {
        if(this.things){
            return this.things.enumerateThings();
        }else{
            return [];
        }
    }
    
    // Enumerate all linedefs in the map.
    enumerateLines(): Iterable<WADMapLine> {
        if(this.lines){
            return this.lines.enumerateLines();
        }else{
            return [];
        }
    }
    
    // Enumerate all vertexes in the map.
    enumerateVertexes(): Iterable<WADMapVertex> {
        if(this.vertexes){
            return this.vertexes.enumerateVertexes();
        }else{
            return [];
        }
    }
    
    // Get the start position for the given player
    getPlayerStart(player: number): WADMapThing | null {
        let playerStart: WADMapThing | null = null;
        for(const thing of this.enumerateThings()){
            if(!WADMapThingTypeMap[thing.type]){
                continue;
            }
            if(WADMapThingTypeMap[thing.type].class === WADMapThingClass.PlayerStart &&
                thing.type === player){ // Doom player starts have the same DoomEdNum as the player
                playerStart = thing;
            }
        }
        // Use the last player start.
        // Other player starts for the same player are voodoo dolls.
        return playerStart;
    }
    
    // Makes the map lumps be parsed in the given format
    setFormat(format: WADMapFormat){
        if(this.lines){
            this.lines.format = format;
        }
    }
}
