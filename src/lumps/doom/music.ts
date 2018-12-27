import {DataBuffer} from "@src/types/dataBuffer";
import {WADLump} from "@src/wad/lump";

// Represents MUS-format audio read from a WAD lump.
export class WADMusic {
    // The name of the music lump.
    name: string;
    // The audio data.
    data: DataBuffer;
    
    // All well-formed MUS data begins with these four bytes.
    static readonly HeaderData: DataBuffer = DataBuffer.from([
        0x4D, 0x55, 0x53, 0x1A,
    ]);
    
    constructor(name: string, data: DataBuffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as MUS audio.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return !!(lump.data && lump.length >= 4 &&
            lump.data.slice(0, 4).equals(WADMusic.HeaderData)
        );
    }
    
    // Create a WADMusic given a WADLump object.
    static from(lump: WADLump): WADMusic {
        if(!this.match(lump)){
            throw new Error("Not a valid MUS lump.");
        }
        return new WADMusic(lump.name, lump.data as DataBuffer);
    }
}

export default WADMusic;
