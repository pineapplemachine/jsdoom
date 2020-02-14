import {WADLump} from "@src/wad/lump";

// Represents a light from the light table for each Doom 64 map.
export interface WADMapLight {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    tag: number;
}

// Each Doom 64 map has a light table and a set of macros. This represents the
// light table for each Doom 64 map. It is similar to PLAYPAL, but includes an
// extra byte for padding, and a two-byte "light tag".
export class WADMapLights {
    // The size of each entry in the light table in bytes
    static readonly EntrySize: number = 6;
    // The lump data as a buffer
    data: Buffer;
    
    constructor(data: Buffer){
        this.data = data;
    }
    
    // Determine whether the given lump can be parsed as a light table
    static match(lump: WADLump){
        return (
            lump.name === "LIGHTS" &&
            lump.length % WADMapLights.EntrySize === 0);
    }
    
    // Get an entry from the light table
    getEntry(index: number): WADMapLight {
        const offset = index * WADMapLights.EntrySize;
        const entry: WADMapLight = {
            red: this.data.readUInt8(offset),
            green: this.data.readUInt8(offset + 1),
            blue: this.data.readUInt8(offset + 2),
            // The following byte is used as padding, according to the Doom 64
            // technical documentation from Doom 64 EX, but it could also be
            // used as the alpha channel of a given colour.
            alpha: this.data.readUInt8(offset + 3),
            tag: this.data.readUInt16LE(offset + 4),
        };
        return entry;
    }
}
