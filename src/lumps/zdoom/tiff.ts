import {WADLump} from "@src/wad/lump";

// Represents a TIFF image read from a WAD lump.
// TIFF images may be either static or animated.
// See: http://www.fileformat.info/format/tiff/corion.htm
export class WADTiff {
    // All well-formed TIFF data begins with these one of two two-byte
    // headers, "II" or "MM". "II" indicates that data in the file is stored
    // in little-endian format (Intel byte order). "MM" indicates that data
    // is stored in big-endian format (Motorola byte order).
    // The third byte in a TIFF image is always the number 42 (0x2A).
    static readonly HeaderDataLE: Buffer = Buffer.from([
        0x49, 0x49, 0x2A,
    ]);
    static readonly HeaderDataBE: Buffer = Buffer.from([
        0x4D, 0x4D, 0x2A,
    ]);
    
    // The name of the TIFF image.
    name: string;
    // The TIFF pixel data.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a TIFF.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return !!(lump.data && lump.length >= 3 && (
            lump.data.slice(0, 3).equals(WADTiff.HeaderDataLE) ||
            lump.data.slice(0, 3).equals(WADTiff.HeaderDataBE)
        ));
    }
    
    // Create a WADTiff given a WADLump object.
    static from(lump: WADLump): WADTiff {
        if(!this.match(lump)){
            throw new Error("Not a valid TIFF lump.");
        }
        return new WADTiff(lump.name, lump.data as Buffer);
    }
    
    // Get the width of the TIFF image in pixels.
    get width(): number {
        // TODO: Implement this
        return 0;
    }
    
    // Get the height of the TIFF image in pixels.
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

export default WADTiff;
