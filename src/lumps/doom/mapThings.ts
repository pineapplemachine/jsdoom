import {WADLump} from "@src/wad/lump";

import {WADMapThingType, WADMapThingTypeList} from "./mapThingType";

// Enumeration of recognized flags for Doom/Heretic things.
// Includes Boom and MBF extensions.
export enum WADMapThingFlag {
    // Present on easy skill levels 1 and 2 (TYTD & HNTR)
    Easy = 0x0001,
    // Present on medium skill level 3 (HMP)
    Medium = 0x0002,
    // Present on hard skill levels 4 and 5 (UV & NM)
    Hard = 0x0004,
    // Deaf/ambush flag
    Ambush = 0x0008,
    // Multiplayer only; not present in single-player
    MultiplayerOnly = 0x0010,
    // Doesn't appear in deathmatch (Boom)
    NoDeathmatch = 0x0020,
    // Doesn't appear in co-op (Boom)
    NoCooperative = 0x0040,
    // Friendly monster (Marine's Best Friend)
    Friendly = 0x0080,
}

// Represents a single thing read from a Doom or Heretic format THINGS lump.
export class WADMapThing {
    // The x position of the thing.
    x: number;
    // The y position of the thing.
    y: number;
    // The angle of the thing, measured in degrees.
    angle: number;
    // The thing type index.
    type: number;
    // Thing flags. See WADMapThingFlag for possible values.
    flags: number;
    
    constructor(options: {
        x: number,
        y: number,
        angle: number,
        type: number,
        flags: number,
    }) {
        this.x = options.x;
        this.y = options.y;
        this.angle = options.angle;
        this.type = options.type;
        this.flags = options.flags;
    }
    
    // Get a WADMapThingType object corresponding to the thing's type number.
    // Returns null if there was no matching thing type.
    getTypeObject(): (WADMapThingType | null) {
        for(const thingType of WADMapThingTypeList){
            if(this.type === thingType.id){
                return thingType;
            }
        }
        return null;
    }
    
    get easyFlag(): boolean {
        return !!(this.flags & WADMapThingFlag.Easy);
    }
    get mediumFlag(): boolean {
        return !!(this.flags & WADMapThingFlag.Medium);
    }
    get hardFlag(): boolean {
        return !!(this.flags & WADMapThingFlag.Hard);
    }
    get ambushFlag(): boolean {
        return !!(this.flags & WADMapThingFlag.Ambush);
    }
    get multiplayerOnlyFlag(): boolean {
        return !!(this.flags & WADMapThingFlag.MultiplayerOnly);
    }
    get noDeathmatchFlag(): boolean {
        return !!(this.flags & WADMapThingFlag.NoDeathmatch);
    }
    get noCooperativeFlag(): boolean {
        return !!(this.flags & WADMapThingFlag.NoCooperative);
    }
    get friendlyFlag(): boolean {
        return !!(this.flags & WADMapThingFlag.Friendly);
    }
}

// Represents a Doom or Heretic format "THINGS" lump.
// See: https://doomwiki.org/wiki/Thing
export class WADMapThings {
    // Map things lumps are always named "THINGS".
    static readonly LumpName: string = "THINGS";
    // The thing data.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as map things.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.length % 10 === 0 && (
            lump.name.toUpperCase() === WADMapThings.LumpName
        );
    }
    
    // Create a WADMapThings given a WADLump object.
    static from(lump: WADLump): WADMapThings {
        if(!this.match(lump)){
            throw new Error("Not a valid THINGS lump.");
        }
        return new WADMapThings(lump.name, <Buffer> lump.data);
    }
    
    // Get the number of things represented in the lump.
    get length(): number {
        return Math.floor(this.data.length / 10);
    }
    
    // Get the thing at an index.
    getThing(thingIndex: number): WADMapThing {
        if(thingIndex < 0 || thingIndex >= this.length){
            throw new Error("Thing index out of bounds.");
        }
        const thingOffset: number = 10 * thingIndex;
        return new WADMapThing({
            x: this.data.readInt16LE(thingOffset),
            y: this.data.readInt16LE(thingOffset + 2),
            angle: this.data.readInt16LE(thingOffset + 4),
            type: this.data.readUInt16LE(thingOffset + 6),
            flags: this.data.readUInt16LE(thingOffset + 8),
        });
    }
    
    // Enumerate all of the things in the lump.
    *enumerateThings(): Iterable<WADMapThing> {
        const length: number = this.length;
        for(let thingIndex: number = 0; thingIndex < length; thingIndex++){
            yield this.getThing(thingIndex);
        }
    }
}

export default WADMapThings;
