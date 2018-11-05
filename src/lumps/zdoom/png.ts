import {WADLump} from "@src/wad/lump";

// Represents a PNG image read from a WAD lump.
export class WADPng {
    // The name of the PNG graphic.
    name: string;
    // The PNG pixel data.
    data: Buffer;
    
    // All well-formed PNG data begins with these eight bytes.
    static readonly HeaderData: Buffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    ]);
    
    constructor(name: string, data: Buffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a PNG.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return !!(lump.data && lump.length >= 8 &&
            lump.data.slice(0, 8).equals(WADPng.HeaderData)
        );
    }
    
    // Create a WADPng given a WADLump object.
    static from(lump: WADLump): WADPng {
        if(!this.match(lump)){
            throw new Error("Not a valid PNG lump.");
        }
        return new WADPng(lump.name, lump.data as Buffer);
    }
    
    // Get the width of the PNG in pixels.
    get width(): number {
        // TODO: Implement this
        return 0;
    }
    
    // Get the height of the PNG in pixels.
    get height(): number {
        // TODO: Implement this
        return 0;
    }
    
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(): Buffer {
        // TODO: Implement this
        return Buffer.alloc(0);
    }
}

export default WADPng;
