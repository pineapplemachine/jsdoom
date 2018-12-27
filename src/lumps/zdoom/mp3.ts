import {DataBuffer} from "@src/types/dataBuffer";
import {WADLump} from "@src/wad/lump";

// Represents MP3 audio read from a WAD lump.
export class WADMp3 {
    // The name of the MP3 audio.
    name: string;
    // The audio data.
    data: DataBuffer;
    
    // Most well-formed MP3 data begins with these bytes. ("ID3")
    // TODO: Detect MP3 lumps more reliably!
    static readonly HeaderData: DataBuffer = DataBuffer.from([
        0x49, 0x44, 0x33,
    ]);
    
    constructor(name: string, data: DataBuffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a PNG.
    // Returns false otherwise.
    // TODO: This is NOT foolproof and will result in false negatives.
    static match(lump: WADLump): boolean {
        return !!(lump.data && lump.length >= 3 &&
            lump.data.slice(0, 3).equals(WADMp3.HeaderData)
        );
    }
    
    // Create a WADMp3 given a WADLump object.
    static from(lump: WADLump): WADMp3 {
        if(!this.match(lump)){
            throw new Error("Not a valid PNG lump.");
        }
        return new WADMp3(lump.name, lump.data as DataBuffer);
    }
}

export default WADMp3;
