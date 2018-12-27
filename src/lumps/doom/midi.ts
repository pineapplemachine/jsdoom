import {WADLump} from "@src/wad/lump";

// Represents MIDI-format audio read from a WAD lump.
export class WADMidi {
    // All well-formed MIDI data begins with these eight bytes.
    static readonly HeaderData: Buffer = Buffer.from([
        0x4D, 0x54, 0x68, 0x64, 0x00, 0x00, 0x00, 0x06,
    ]);
    
    // The name of the MIDI lump.
    name: string;
    // The audio data.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a PNG.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return !!(lump.data && lump.length >= 8 &&
            lump.data.slice(0, 8).equals(WADMidi.HeaderData)
        );
    }
    
    // Create a WADMidi given a WADLump object.
    static from(lump: WADLump): WADMidi {
        if(!this.match(lump)){
            throw new Error("Not a valid MUS lump.");
        }
        return new WADMidi(lump.name, lump.data as Buffer);
    }
}

export default WADMidi;
