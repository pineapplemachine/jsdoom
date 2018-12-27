import {DataBuffer} from "@src/types/dataBuffer";
import {WADLump} from "@src/wad/lump";

import {readPaddedString8} from "@src/wad/string";

// Enumeration of recognized types for Doom sectors.
export enum WADMapSectorType {
    // No special sector effect.
    Normal = 0,
    // Light blinks randomly.
    BlinkRandom = 1,
    // Light blinks every 0.5 seconds.
    BlinkHalfSecond = 2,
    // Light blinks once per second.
    BlinkSecond = 3,
    // Light blinks every 0.5 second, plus 20% damage per second.
    Damage20AndBlink = 4,
    // Inflict ItemSize% damage to the player per second.
    DamageItemSize = 5,
    // Inflict 5% damage to the player per second.
    Damage5 = 7,
    // Light glows/oscillates.
    LightGlows = 8,
    // Sector is marked as a secret.
    Secret = 9,
    // Sector closes like a door 30 seconds after level start.
    DoorClose = 10,
    // Inflict 20% damage to the player per second; exit on death.
    Damage20AndEnd = 11,
    // Blink every 0.5 seconds, synchronized.
    BlinkHalfSecondSync = 12,
    // Blink once every second, synchronized.
    BlinkSecondSync = 13,
    // Sector opens like a door 300 seconds after level start.
    DoorOpen = 14,
    // Inflict 20% damage to the player per second.
    Damage20 = 16,
    // Sector light flickers randomly.
    Flicker = 17,
}

// Boom sector flags.
export enum WADMapSectorFlag {
    Damage5 = 0x0020,
    DamageItemSize = 0x0040,
    Damage20 = 0x0060, // Damage5 | DamageItemSize
    Secret = 0x0080,
    Friction = 0x0100,
    Pusher = 0x0200,
}

// Represents a single sector read from a Doom or Heretic format SECTORS lump.
export class WADMapSector {
    // The height (Z position) of the sector's floor.
    floorHeight: number;
    // The ceiling (Z position) of the sector's ceiling.
    ceilingHeight: number;
    // The name of the graphic lump to use for the floor.
    floorFlat: string;
    // The name of the graphic lump to use for the ceiling.
    ceilingFlat: string;
    // The sector light level.
    light: number;
    // Sector type/flags.
    type: number;
    // The sector's tag number. (Referenced by linedef actions.)
    tag: number;
    
    constructor(options: {
        floorHeight: number,
        ceilingHeight: number,
        floorFlat: string,
        ceilingFlat: string,
        light: number,
        type: number,
        tag: number,
    }) {
        this.floorHeight = options.floorHeight;
        this.ceilingHeight = options.ceilingHeight;
        this.floorFlat = options.floorFlat;
        this.ceilingFlat = options.ceilingFlat;
        this.light = options.light;
        this.type = options.type;
        this.tag = options.tag;
    }
}

// Represents a Doom or Heretic format "SECTORS" lump.
// See: https://doomwiki.org/wiki/Sector
export class WADMapSectors {
    // Map sectors lumps are always named "SECTORS".
    static readonly LumpName: string = "SECTORS";
    // The number of bytes which make up each sector in the lump.
    static readonly ItemSize: number = 26;
    // The sector data.
    data: DataBuffer;
    
    constructor(name: string, data: DataBuffer) {
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as map sectors.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.length % WADMapSectors.ItemSize === 0 && (
            lump.name.toUpperCase() === WADMapSectors.LumpName
        );
    }
    
    // Create a WADMapSectors given a WADLump object.
    static from(lump: WADLump): WADMapSectors {
        return new WADMapSectors(lump.name, lump.data as DataBuffer);
    }
    
    // Get the number of sectors represented in the lump.
    get length(): number {
        return Math.floor(this.data.length / WADMapSectors.ItemSize);
    }
    
    // Get the sector at an index.
    getSector(sectorIndex: number): WADMapSector {
        if(sectorIndex < 0 || sectorIndex >= this.length){
            throw new Error("Sector index out of bounds.");
        }
        const sectorOffset: number = WADMapSectors.ItemSize * sectorIndex;
        return new WADMapSector({
            floorHeight: this.data.readInt16LE(sectorOffset),
            ceilingHeight: this.data.readInt16LE(sectorOffset + 2),
            floorFlat: readPaddedString8(this.data, sectorOffset + 4),
            ceilingFlat: readPaddedString8(this.data, sectorOffset + 12),
            light: this.data.readInt16LE(sectorOffset + 20),
            type: this.data.readUInt16LE(sectorOffset + 22),
            tag: this.data.readUInt16LE(sectorOffset + 24),
        });
    }
    
    // Enumerate all of the sectors in the lump.
    *enumerateSectors(): Iterable<WADMapSector> {
        const length: number = this.length;
        for(let sectorIndex: number = 0; sectorIndex < length; sectorIndex++){
            yield this.getSector(sectorIndex);
        }
    }
}

export default WADMapSectors;
