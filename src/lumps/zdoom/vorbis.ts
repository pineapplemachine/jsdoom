import {Buffer} from "buffer";

import {WADLump} from "@src/wad/lump";

// Represents OGG Vorbis audio read from a WAD lump.
export class WADVorbis {
    // All well-formed OGG data begins with these four bytes. ("OggS")
    static readonly HeaderData: Buffer = Buffer.from([
        0x4F, 0x67, 0x67, 0x53,
    ]);
    
    // The name of the Vorbis audio.
    name: string;
    // The audio data.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as OGG Vorbis audio.
    // Returns false otherwise.
    // TODO: This isn't actually quite correct
    static match(lump: WADLump): boolean {
        return !!(lump.data && lump.length >= 4 &&
            lump.data.slice(0, 4).equals(WADVorbis.HeaderData)
        );
    }
    
    // Create a WADVorbis given a WADLump object.
    static from(lump: WADLump): WADVorbis {
        if(!this.match(lump)){
            throw new Error("Not a valid PNG lump.");
        }
        return new WADVorbis(lump.name, lump.data as Buffer);
    }
}

export default WADVorbis;
