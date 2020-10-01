import {WADLump} from "@src/wad/lump";

import {WADMapThingType, WADMapThingTypeMap} from "./mapThingType";

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

// A set of properties used to easily access thing flag metadata.
export interface WADMapThingFlags {
    // Whether or not the thing appears on skill 1 and 2
    easyFlag: boolean;
    // Whether or not the thing appears on skill 3
    mediumFlag: boolean;
    // Whether or not the thing appears on skill 4 and 5
    hardFlag: boolean;
    // If thing is a monster, wait until the player is in view before attacking
    ambushFlag: boolean;
    // Thing will only appear in a deathmatch or cooperative game
    multiplayerOnlyFlag: boolean;
    // Thing will not appear in a deathmatch game
    noDeathmatchFlag: boolean;
    // Thing will not appear in a cooperative game
    noCooperativeFlag: boolean;
    // Thing is friendly (MBF)
    friendlyFlag: boolean;
}

// Represents a single thing read from a Doom or Heretic format THINGS lump.
export class WADMapThingBase implements WADMapThingFlags {
    // The x position of the thing.
    x: number;
    // The y position of the thing.
    y: number;
    // The angle of the thing, measured in degrees.
    angle: number;
    // The thing type index.
    type: number;
    
    constructor(options: {
        x: number,
        y: number,
        angle: number,
        type: number,
    }) {
        this.x = options.x;
        this.y = options.y;
        this.angle = options.angle;
        this.type = options.type;
    }
    
    // Get a WADMapThingType object corresponding to the thing's type number.
    // Returns null if there was no matching thing type.
    getTypeObject(): (WADMapThingType | null) {
        let type: WADMapThingType | null = WADMapThingTypeMap[this.type];
        if(type === undefined){
            type = null;
        }
        return type;
    }

    get easyFlag(): boolean { return false; }
    get mediumFlag(): boolean { return false; }
    get hardFlag(): boolean { return false; }
    get ambushFlag(): boolean { return false; }
    get multiplayerOnlyFlag(): boolean { return false; }
    get noDeathmatchFlag(): boolean { return false; }
    get noCooperativeFlag(): boolean { return false; }
    get friendlyFlag(): boolean { return false; }
}

export class WADMapDoomThing extends WADMapThingBase implements WADMapThingFlags {
    // Thing flags. See WADMapThingFlag for possible values.
    flags: number;

    constructor(options: {
        x: number,
        y: number,
        angle: number,
        type: number,
        flags: number,
    }){
        super(options);
        this.flags = options.flags;
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

export class WADMapHexenThing extends WADMapThingBase implements WADMapThingFlags {
    // The up/down offset from the sector floor for the given thing.
    z: number;
    // The given thing's ID, used by scripts or specials.
    tid: number;
    // The action special to execute upon death or being picked up.
    special: number;
    // The arguments for the special (up to 5 unsigned bytes).
    specialArgs: number[];
    // Thing flags. See WADMapThingFlag for possible values.
    flags: number;
    
    constructor(options: {
        type: number,
        x: number,
        y: number,
        z: number,
        tid: number,
        angle: number,
        flags: number,
        special: number,
        specialArgs: number[],
    }){
        super(options);
        this.flags = options.flags;
        this.z = options.z;
        this.tid = options.tid;
        this.special = options.special;
        this.specialArgs = options.specialArgs;
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

export type WADMapThing = WADMapDoomThing | WADMapHexenThing;

// Represents a Doom or Heretic format "THINGS" lump.
// See: https://doomwiki.org/wiki/Thing
export class WADMapThings {
    // Map things lumps are always named "THINGS".
    static readonly LumpName: string = "THINGS";
    // The number of bytes which make up each thing in the lump.
    static readonly ItemSize: number = 10;
    // The thing data.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as map things.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.length % WADMapThings.ItemSize === 0 && (
            lump.name.toUpperCase() === WADMapThings.LumpName
        );
    }
    
    // Create a WADMapThings given a WADLump object.
    static from(lump: WADLump): WADMapThings {
        return new WADMapThings(lump.name, lump.data as Buffer);
    }
    
    // Get the number of things represented in the lump.
    get length(): number {
        return Math.floor(this.data.length / WADMapThings.ItemSize);
    }
    
    // Get the thing at an index.
    getThing(thingIndex: number): WADMapThing {
        if(thingIndex < 0 || thingIndex >= this.length){
            throw new Error("Thing index out of bounds.");
        }
        const thingOffset: number = WADMapThings.ItemSize * thingIndex;
        return new WADMapDoomThing({
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
