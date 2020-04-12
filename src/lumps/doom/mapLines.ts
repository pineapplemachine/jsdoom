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
class WADMapLineBase {
    // The index of the start vertex.
    startVertex: number;
    // The index of the end vertex.
    endVertex: number;
    // Front sidedef index. (0xffff means no sidedef.)
    frontSidedef: number;
    // Back sidedef index. (0xffff means no sidedef.)
    backSidedef: number;
    // Linedef flags. See WADMapLineFlag for possible values.
    flags: number;
    // The format of the map this linedef comes from.
    format: WADMapFormat;
    
    constructor(options: {
        startVertex: number,
        endVertex: number,
        frontSidedef: number,
        backSidedef: number,
        flags?: number,
    }) {
        this.startVertex = options.startVertex;
        this.endVertex = options.endVertex;
        this.frontSidedef = options.frontSidedef;
        this.backSidedef = options.backSidedef;
        this.flags = options.flags ? options.flags : 0;
        this.format = WADMapFormat.Doom;
    }
    
    get alwaysAutomapFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.AlwaysAutomap);
    }
    get blockMonstersFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.BlockMonsters);
    }
    get blockSoundFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.BlockSound);
    }
    get impassableFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.Impassable);
    }
    get lowerUnpeggedFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.LowerUnpegged);
    }
    get noAutomapFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.NoAutomap);
    }
    get secretFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.Secret);
    }
    get twoSidedFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.TwoSided);
    }
    get upperUnpeggedFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.UpperUnpegged);
    }
}

export class WADMapDoomLine extends WADMapLineBase {
    // Action or other special.
    special: number;
    // Sector tag. Usually indicates the target of linedef actions.
    tag: number;
    
    constructor(options: {
        startVertex: number,
        endVertex: number,
        frontSidedef: number,
        backSidedef: number,
        special: number,
        tag: number,
        flags: number,
    }) {
        const baseLineOptions = {
            startVertex: options.startVertex,
            endVertex: options.endVertex,
            frontSidedef: options.frontSidedef,
            backSidedef: options.backSidedef,
            flags: options.flags,
        };
        super(baseLineOptions);
        this.special = options.special;
        this.tag = options.tag;
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
    
    get passThroughFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.PassThrough);
    }
}

// Represents a linedef from a Hexen format map
export class WADMapHexenLine extends WADMapLineBase {
    // Action or other special.
    special: number;
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
        // action special.
        const baseLineOptions = {
            startVertex: options.startVertex,
            endVertex: options.endVertex,
            flags: options.flags,
            frontSidedef: options.frontSidedef,
            backSidedef: options.backSidedef,
        };
        super(baseLineOptions);
        this.special = options.special;
        this.specialArgs = options.specialArgs;
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
    
    get passThroughFlag(): boolean {
        return !!(this.flags & WADMapLineFlag.PassThrough);
    }
}

// Enumeration of line flags used by Doom 64 linedefs, according to the Doom 64
// tech bible. Does not include unknown/unused flags.
enum WADMapDoom64LineFlag {
    // Show middle texture on a two-sided line
    ShowMidtex = 0x0200,
    // Not clipped against occlusion buffer
    Unclipped = 0x0400,
    // Middle texture is unpegged, and blocks projectiles
    MiddleUnpegged = 0x0800,
    // Activated when a thing with a TID matching the tag is killed
    ActivateOnKill = 0x1000,
    // Switch masks - determines where and how a switch is drawn on the line
    SwitchMask1 = 0x2000,
    SwitchMask2 = 0x4000,
    SwitchMask3 = 0x8000,
    // "Check for player floor height. Checks for ceiling height if flag is not set."
    FloorHeightCheck = 0x10000,
    // Scroll texture right
    ScrollRight = 0x20000,
    // Scroll texture left
    ScrollLeft = 0x40000,
    // Scroll texture up
    ScrollUp = 0x80000,
    // Scroll texture down
    ScrollDown = 0x100000,
    // Clamp gradient to upper part
    ClampUpper = 0x200000,
    // Clamp gradient to lower part
    ClampLower = 0x400000,
    // Use lower/upper gradient colours instead of thing colour
    UseGradient = 0x800000,
    // Prevent activation from the back side
    FrontActivation = 0x1000000,
    // Reverse the gradient; use the top colour on the bottom and vice versa
    ReverseGradient = 0x4000000,
    // Mirror the texture horizontally
    MirrorHorizontal = 0x40000000,
    // Mirror the texture vertically
    MirrorVertical = 0x80000000,
}

// Enumeration of flags in the "special" field of a Doom 64 LINEDEFS lump,
// according to the Doom 64 tech bible.
enum WADMapDoom64SpecialFlag {
    // The line special also activates a macro script
    Macro = 0x100,
    // Requires red key to activate
    RedKey = 0x200,
    // Requires blue key to activate
    BlueKey = 0x400,
    // Requires yellow key to activate
    YellowKey = 0x800,
    // Special is activated by player crossing the line
    ActivateByCrossing = 0x1000,
    // Special is activated by player shooting the line
    ActivateByShooting = 0x2000,
    // Special is activated by player using the line
    ActivateByUsing = 0x4000,
    // Special can be activated more than once
    ActivateRepeatedly = 0x8000,
}

// Represents a linedef from a Doom 64 format map
export class WADMapDoom64Line extends WADMapLineBase {
    // The line's action special, or the macro number, and flags specifying how
    // the action special can be triggered.
    special: number;
    // Tag of sector to apply the action special to, OR the TID of the thing
    // that must die in order for the special to be activated, if the
    // ActivateOnKill flag is set.
    tag: number;
    
    constructor(options: {
        startVertex: number,
        endVertex: number,
        flags: number,
        tag: number,
        special: number,
        frontSidedef: number,
        backSidedef: number,
    }) {
        super(options);
        this.special = options.special;
        this.tag = options.tag;
        this.format = WADMapFormat.Doom64;
    }
    
    getSpecialObject(): (WADMapLineSpecial | null) {
        for(const special of WADMapHexenLineSpecialList){
            if(this.special === special.id){
                return special;
            }
        }
        return null;
    }
    
    get macro(): boolean {
        return(this.special & WADMapDoom64SpecialFlag.Macro) > 0;
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

// Combined Doom, Hexen, and Doom 64 line class type
export type WADMapLine = WADMapDoomLine | WADMapHexenLine | WADMapDoom64Line;

// Represents a LINEDEFS lump.
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
    
    protected parseDoomLine(lineOffset: number): WADMapDoomLine {
        return new WADMapDoomLine({
            startVertex: this.data.readUInt16LE(lineOffset),
            endVertex: this.data.readUInt16LE(lineOffset + 2),
            flags: this.data.readUInt16LE(lineOffset + 4),
            special: this.data.readUInt16LE(lineOffset + 6),
            tag: this.data.readUInt16LE(lineOffset + 8),
            frontSidedef: this.data.readUInt16LE(lineOffset + 10),
            backSidedef: this.data.readUInt16LE(lineOffset + 12),
        });
    }
    
    protected parseDoom64Line(lineOffset: number): WADMapDoom64Line {
        return new WADMapDoom64Line({
            startVertex: this.data.readUInt16LE(lineOffset),
            endVertex: this.data.readUInt16LE(lineOffset + 2),
            flags: this.data.readUInt32LE(lineOffset + 4),
            special: this.data.readUInt16LE(lineOffset + 8),
            tag: this.data.readUInt16LE(lineOffset + 10),
            frontSidedef: this.data.readUInt16LE(lineOffset + 12),
            backSidedef: this.data.readUInt16LE(lineOffset + 14),
        });
    }
    
    protected parseHexenLine(lineOffset: number): WADMapHexenLine {
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
    
    // Get the linedef at an index.
    getLine(lineIndex: number): WADMapLine {
        if(lineIndex < 0 || lineIndex >= this.length){
            throw new Error("Linedef index out of bounds.");
        }
        const lineOffset: number = this.itemSize * lineIndex;
        if(this.format === WADMapFormat.Hexen){
            return this.parseHexenLine(lineOffset);
        }else if(this.format === WADMapFormat.Doom64){
            return this.parseDoom64Line(lineOffset);
        }
        // Assume Doom format
        return this.parseDoomLine(lineOffset);
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
