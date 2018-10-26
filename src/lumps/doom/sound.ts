import {WADLump} from "@src/wad/lump";

// Represents DMX-format audio read from a WAD lump.
export class WADSound {
    // The name of the music lump.
    name: string;
    // The audio data.
    data: Buffer;
    
    // All well-formed DMX data begins with these two bytes.
    static readonly HeaderData: Buffer = Buffer.from([
        0x03, 0x00,
    ]);
    
    constructor(name: string, data: Buffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as DMX audio.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return !!(lump.name.startsWith("DS") &&
            lump.data && lump.length >= 2 &&
            lump.data.slice(0, 2).equals(WADSound.HeaderData)
        );
    }
    
    // Create a WADSound given a WADLump object.
    static from(lump: WADLump): WADSound {
        if(!this.match(lump)){
            throw new Error("Not a valid DMX lump.");
        }
        return new WADSound(lump.name, <Buffer> lump.data);
    }
}

export default WADSound;
