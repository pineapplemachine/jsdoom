import {WADLump} from "@src/wad/lump";

// Represents a PC speaker sound effect read from a WAD lump.
export class WADSpeakerEffect {
    // The name of the sound effect lump.
    name: string;
    // The audio data.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a PC speaker sound effect.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return !!(lump.name.startsWith("DP") &&
            lump.data && lump.length >= 4 &&
            // First four bytes look like this: 0x00 0x00 [length - 4] 0x00
            4 + (lump.data.readUInt32LE(0) / 65536) === lump.length
        );
    }
    
    // Create a WADSpeakerEffect given a WADLump object.
    static from(lump: WADLump): WADSpeakerEffect {
        if(!this.match(lump)){
            throw new Error("Not a valid DMX lump.");
        }
        return new WADSpeakerEffect(lump.name, <Buffer> lump.data);
    }
}

export default WADSpeakerEffect;
