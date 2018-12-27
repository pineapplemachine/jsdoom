import {DataBuffer} from "@src/types/dataBuffer";
import {WADLump} from "@src/wad/lump";

// Represents WAV audio read from a WAD lump.
export class WADWave {
    // The name of the WAV audio.
    name: string;
    // The audio data.
    data: DataBuffer;
    
    // All well-formed WAV data begins with these four bytes. ("RIFF")
    static readonly HeaderData: DataBuffer = DataBuffer.from([
        0x52, 0x49, 0x46, 0x46,
    ]);
    
    // All well-formed WAV data has these bytes starting at 0x08. ("WAVE")
    static readonly WaveData: DataBuffer = DataBuffer.from([
        0x57, 0x41, 0x56, 0x45,
    ]);
    
    constructor(name: string, data: DataBuffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as WAV audio.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return !!(lump.data && lump.length >= 12 &&
            lump.data.slice(0, 4).equals(WADWave.HeaderData) &&
            lump.data.slice(8, 12).equals(WADWave.WaveData)
        );
    }
    
    // Create a WADWave given a WADLump object.
    static from(lump: WADLump): WADWave {
        if(!this.match(lump)){
            throw new Error("Not a valid PNG lump.");
        }
        return new WADWave(lump.name, lump.data as DataBuffer);
    }
}

export default WADWave;
