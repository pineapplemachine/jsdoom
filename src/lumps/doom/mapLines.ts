import {WADLump} from "@src/wad/lump";

import {WADMapFormat} from "./mapFormat";
import {WADMapLineSpecial, WADMapHexenLineSpecialList, WADMapLineSpecialList} from "./mapLineSpecial";
import {WADMapLineSpecialGeneralized, WADMapLineSpecialGeneralizedList} from "./mapLineSpecial";

// Enumeration of recognized flags for Doom linedefs.
// Includes Boom extensions.
export enum WADMapLineFlag {
    // Block movement of players and monsters
    Impassable = 0x0001,
    // Block movement of monsters (but not players)
    BlockMonsters = 0x0002,
    // One-sided linedefs separate a sector from the "void" whereas
    // two-sided linedefs separate sectors from each other.
    TwoSided = 0x0004,
    // Unpegged upper texture (affects vertical offset)
    UpperUnpegged = 0x0008,
    // Unpegged lower texture (affects vertical offset)
    LowerUnpegged = 0x0010,
    // Shown as one-sided on automap
    // Also prevents monsters from activating a door action linedef
    Secret = 0x0020,
    // Blocks sound propagation.
    BlockSound = 0x0040,
    // Never shown on the automap.
    NoAutomap = 0x0080,
    // Always shown on the automap.
    AlwaysAutomap = 0x0100,
    // Pass-through action. (Boom)
    PassThrough = 0x0200,
}

// Represents a single linedef read from a Doom format LINEDEFS lump.
export class WADMapLine {
    // The index of the start vertex.
    startVertex: number;
    // The index of the end vertex.
    endVertex: number;
    // Linedef flags. See WADMapLineFlag for possible values.
    flags: number;
    // Action or other special.
    special: number;
    // Sector tag. Usually indicates the target of linedef actions.
    tag: number;
    // Front sidedef index. (0xffff means no sidedef.)
    frontSidedef: number;
    // Back sidedef index. (0xffff means no sidedef.)
    backSidedef: number;
    // The format of the map this linedef comes from.
    format: WADMapFormat;
    
    constructor(options: {
        startVertex: number,
        endVertex: number,
        flags: number,
        special: number,
        tag: number,
        frontSidedef: number,
        backSidedef: number,
    }) {
        this.startVertex = options.startVertex;
        this.endVertex = options.endVertex;
        this.flags = options.flags;
        this.special = options.special;
        this.tag = options.tag;
        this.frontSidedef = options.frontSidedef;
        this.backSidedef = options.backSidedef;
        this.format = WADMapFormat.Doom;
    }
    
    getSpecialObject(): (WADMapLineSpecial | WADMapLineSpecialGeneralized | null) {
        for(const special of WADMapLineSpecialGeneralizedList){
            if(this.special >= special.low && this.special < special.high){
                return special;
            }
        }
        for(const special of WADMapLineSpecialList){
            if(this.special === special.id){
                return special;
            }
        }
        return null;
    }
    
    get impassableFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.Impassable);
    }
    get blockMonstersFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.BlockMonsters);
    }
    get twoSidedFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.TwoSided);
    }
    get upperUnpeggedFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.UpperUnpegged);
    }
    get lowerUnpeggedFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.LowerUnpegged);
    }
    get secretFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.Secret);
    }
    get blockSoundFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.BlockSound);
    }
    get noAutomapFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.NoAutomap);
    }
    get alwaysAutomapFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.AlwaysAutomap);
    }
    get passThroughFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.PassThrough);
    }
}

// Represents a linedef from a Hexen format map
export class WADMapHexenLine extends WADMapLine {
    // The arguments for the line's action special.
    specialArgs: number[];
    
    constructor(options: {
        startVertex: number,
        endVertex: number,
        flags: number,
        special: number,
        frontSidedef: number,
        backSidedef: number,
        specialArgs: number[],
    }) {
        // WADMapHexenLine does not make use of the "tag" property. Instead, it
        // uses up to 5 "special arguments" which act as arguments for the
        // action special
        const doomLineOptions = {
            startVertex: options.startVertex,
            endVertex: options.endVertex,
            flags: options.flags,
            special: options.special,
            tag: options.specialArgs[0],
            frontSidedef: options.frontSidedef,
            backSidedef: options.backSidedef,
        };
        super(doomLineOptions);
        this.specialArgs = options.specialArgs;
        this.tag = this.specialArgs[0];
        this.format = WADMapFormat.Hexen;
    }
    
    getSpecialObject(): (WADMapLineSpecial | null) {
        for(const special of WADMapHexenLineSpecialList){
            if(this.special === special.id){
                return special;
            }
        }
        return null;
    }
}

// Get the lump size corresponding to the given map format
function linedefsEntrySizeForFormat(format: WADMapFormat): number {
    switch(format){
        case WADMapFormat.Hexen:
        case WADMapFormat.Doom64:
            return 16;
        case WADMapFormat.Doom:
        default:
            return 14;
    }
}

// Represents a Doom format "LINEDEFS" lump.
// See: https://doomwiki.org/wiki/Linedef
export class WADMapLines {
    // Map linedef lumps are always named "LINEDEFS".
    static readonly LumpName: string = "LINEDEFS";
    // The number of bytes that make up each linedef in the lump.
    static readonly ItemSize: number = 14;
    // The linedefs data.
    data: Buffer;
    // The format this LINEDEFS lump is in
    format: WADMapFormat;
    
    constructor(data: Buffer, format: WADMapFormat = WADMapFormat.Doom) {
        this.data = data;
        this.format = format;
    }
    
    // Returns true when a WADLump can be read as map linedefs.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        const nameMatch = lump.name.toUpperCase() === WADMapLines.LumpName;
        if(!nameMatch){
            return false;
        }
        // WADMapFormat is a const enum, and length is its last member.
        for(let format = 0; format < WADMapFormat.length; format++){
            const sizeMatch = WADMapLines.sizeMatch(lump.length, format);
            if(sizeMatch){
                return true;
            }
        }
        return false;
    }
    
    // Checks if the given size is a match for the given format.
    static sizeMatch(lumpSize: number, format: WADMapFormat): boolean {
        const size = linedefsEntrySizeForFormat(format);
        return lumpSize % size === 0;
    }
    
    // Create a WADMapLines given a WADLump object.
    static from(lump: WADLump): WADMapLines {
        return new WADMapLines(lump.data as Buffer);
    }
    
    // Get the number of bytes which make up each linedef in the lump.
    get itemSize(): number {
        return linedefsEntrySizeForFormat(this.format);
    }
    
    // Get the number of linedefs represented in the lump.
    get length(): number {
        return Math.floor(this.data.length / this.itemSize);
    }
    
    // Get the linedef at an index.
    getLine(lineIndex: number): WADMapLine {
        if(lineIndex < 0 || lineIndex >= this.length){
            throw new Error("Linedef index out of bounds.");
        }
        const lineOffset: number = this.itemSize * lineIndex;
        if(this.format === WADMapFormat.Hexen){
            return new WADMapHexenLine({
                startVertex: this.data.readUInt16LE(lineOffset),
                endVertex: this.data.readUInt16LE(lineOffset + 2),
                flags: this.data.readUInt16LE(lineOffset + 4),
                special: this.data.readUInt8(lineOffset + 6),
                specialArgs: [
                    this.data.readUInt8(lineOffset + 7),
                    this.data.readUInt8(lineOffset + 8),
                    this.data.readUInt8(lineOffset + 9),
                    this.data.readUInt8(lineOffset + 10),
                    this.data.readUInt8(lineOffset + 11),
                ],
                frontSidedef: this.data.readUInt16LE(lineOffset + 12),
                backSidedef: this.data.readUInt16LE(lineOffset + 14),
            });
        }
        // Assume Doom format
        return new WADMapLine({
            startVertex: this.data.readUInt16LE(lineOffset),
            endVertex: this.data.readUInt16LE(lineOffset + 2),
            flags: this.data.readUInt16LE(lineOffset + 4),
            special: this.data.readUInt16LE(lineOffset + 6),
            tag: this.data.readUInt16LE(lineOffset + 8),
            frontSidedef: this.data.readUInt16LE(lineOffset + 10),
            backSidedef: this.data.readUInt16LE(lineOffset + 12),
        });
    }
    
    // Enumerate all of the linedefs in the lump.
    *enumerateLines(): Iterable<WADMapLine> {
        const length: number = this.length;
        for(let lineIndex: number = 0; lineIndex < length; lineIndex++){
            yield this.getLine(lineIndex);
        }
    }
}

export default WADMapLines;
