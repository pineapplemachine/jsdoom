import {WADLump} from "@src/wad/lump";

import {readPaddedString8} from "@src/wad/string";

// Represents a single sidedef read from a Doom format SIDEDEFS lump.
export class WADMapSide {
    // Texture X offset.
    x: number;
    // Texture Y offset.
    y: number;
    // Name of upper texture. (References TEXTUREx)
    upper: string;
    // Name of lower texture. (References TEXTUREx)
    lower: string;
    // Name of middle texture. (References TEXTUREx)
    middle: string;
    // Sector number that this sidedef borders.
    sector: number;
    
    constructor(options: {
        x: number,
        y: number,
        upper: string,
        lower: string,
        middle: string,
        sector: number,
    }) {
        this.x = options.x;
        this.y = options.y;
        this.upper = options.upper;
        this.lower = options.lower;
        this.middle = options.middle;
        this.sector = options.sector;
    }
}

// Represents a Doom format "SIDEDEFS" lump.
// See: https://doomwiki.org/wiki/Sidedef
export class WADMapSides {
    // Map sidedef lumps are always named "SIDEDEFS".
    static readonly LumpName: string = "SIDEDEFS";
    // The number of bytes which make up each sidedef in the lump.
    static readonly ItemSize: number = 30;
    // The sidedefs data.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as map sidedefs.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.length % WADMapSides.ItemSize === 0 && (
            lump.name.toUpperCase() === WADMapSides.LumpName
        );
    }
    
    // Create a WADMapSides given a WADLump object.
    static from(lump: WADLump): WADMapSides {
        return new WADMapSides(lump.name, <Buffer> lump.data);
    }
    
    // Get the number of sidedefs represented in the lump.
    get length(): number {
        return Math.floor(this.data.length / WADMapSides.ItemSize);
    }
    
    // Get the sidedef at an index.
    getSide(lineIndex: number): WADMapSide {
        if(lineIndex < 0 || lineIndex >= this.length){
            throw new Error("Sidedef index out of bounds.");
        }
        const sideOffset: number = WADMapSides.ItemSize * lineIndex;
        return new WADMapSide({
            x: this.data.readInt16LE(sideOffset),
            y: this.data.readInt16LE(sideOffset + 2),
            upper: readPaddedString8(this.data, sideOffset + 4),
            lower: readPaddedString8(this.data, sideOffset + 12),
            middle: readPaddedString8(this.data, sideOffset + 20),
            sector: this.data.readUInt16LE(sideOffset + 28),
        });
    }
    
    // Enumerate all of the sidedefs in the lump.
    *enumerateSides(): Iterable<WADMapSide> {
        const length: number = this.length;
        for(let lineIndex: number = 0; lineIndex < length; lineIndex++){
            yield this.getSide(lineIndex);
        }
    }
}

export default WADMapSides;
