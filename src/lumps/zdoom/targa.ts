import {WADLump} from "@src/wad/lump";

// Represents a TGA image read from a WAD lump.
// TGA images may be either static or animated.
// See: http://www.paulbourke.net/dataformats/tga/
export class WADTarga {
    // The name of the TGA image.
    name: string;
    // The TGA pixel data.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a TGA.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        // Allowed values for the color map type (0x01)
        const colorMapTypes: number[] = [0, 1];
        // All other values are either reserved or intended for special use
        // Allowed values for the data type byte (0x02)
        const dataTypes: number[] = [0, 1, 2, 3, 9, 10, 11, 32, 33];
        // Allowed values for the bits-per-pixel byte (0x10)
        const bitsPerPixel: number[] = [8, 15, 16, 24, 32];
        // Put it all together...
        return !!(lump.data && lump.length >= 18 && (
            colorMapTypes.indexOf(lump.data.readUInt8(0x01)) >= 0 &&
            dataTypes.indexOf(lump.data.readUInt8(0x02)) >= 0 &&
            bitsPerPixel.indexOf(lump.data.readUInt8(0x10)) >= 0
        ));
    }
    
    // Create a WADTarga given a WADLump object.
    static from(lump: WADLump): WADTarga {
        if(!this.match(lump)){
            throw new Error("Not a valid TGA lump.");
        }
        return new WADTarga(lump.name, lump.data as Buffer);
    }
    
    // Get the width of the TGA image in pixels.
    get width(): number {
        return this.data.readUInt16LE(12);
    }
    
    // Get the height of the TGA image in pixels.
    get height(): number {
        return this.data.readUInt16LE(14);
    }
    
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(): Buffer {
        // TODO: Implement this
        return Buffer.alloc(0);
    }
}

export default WADTarga;
