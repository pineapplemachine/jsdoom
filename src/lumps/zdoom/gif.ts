import {DataBuffer} from "@src/types/dataBuffer";
import {WADLump} from "@src/wad/lump";

// Represents a GIF image read from a WAD lump.
// GIF images may be either static or animated.
// See: http://www.matthewflickinger.com/lab/whatsinagif/bits_and_bytes.asp
// See: https://en.wikipedia.org/wiki/GIF
export class WADGif {
    // The name of the GIF image.
    name: string;
    // The GIF pixel data.
    data: DataBuffer;
    
    // All well-formed GIF data starts with one of these two six-byte
    // headers, representing "GIF87a" and "GIF89a" in ASCII text.
    static readonly HeaderData87: DataBuffer = DataBuffer.from([
        0x47, 0x49, 0x46, 0x38, 0x37, 0x61,
    ]);
    static readonly HeaderData89: DataBuffer = DataBuffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
    ]);
    
    constructor(name: string, data: DataBuffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a GIF.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return !!(lump.data && lump.length >= 6 && (
            lump.data.slice(0, 6).equals(WADGif.HeaderData87) ||
            lump.data.slice(0, 6).equals(WADGif.HeaderData89)
        ));
    }
    
    // Create a WADGif given a WADLump object.
    static from(lump: WADLump): WADGif {
        if(!this.match(lump)){
            throw new Error("Not a valid GIF lump.");
        }
        return new WADGif(lump.name, lump.data as DataBuffer);
    }
    
    // Get the width of the GIF image in pixels.
    get width(): number {
        return this.data.readUInt16LE(6);
    }
    
    // Get the height of the GIF image in pixels.
    get height(): number {
        return this.data.readUInt16LE(8);
    }
    
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(): DataBuffer {
        // TODO: Implement this
        // TODO: What to do with animated GIFs?
        return DataBuffer.alloc(0);
    }
}

export default WADGif;
