import {WADLump, WADCategory} from "@src/wad/lump";

import {WADColors} from "@src/lumps/doom/colors";

// Represents one 64 by 64 pixel graphic that is normally used to paint floors
// and ceilings.
// The exclusive use of flats to paint floors and ceilings is is a strict
// limitation in the vanilla Doom engine but the limitation is relaxed in ZDoom
// ports.
export class WADFlat {
    // Names of the markers used in the IWAD to denote the beginning and
    // end of the flat namespace
    static readonly IWADMarkerNames = [
        "F_START", "F1_START", "F2_START", "F3_START",
        "F_END", "F1_END", "F2_END", "F3_END",
    ];
    // The name of the marker at the beginning of the flat namespace.
    static readonly IWADMarkerStart = "F_START";
    // The name of the marker at the end of the flat namespace.
    static readonly IWADMarkerEnd = "F_END";
    // Names of markers used in PWADs to denote the beginning/end of the flat
    // namespace. Unlike the IWAD marker names, these can be used in addition
    // to the flats in the IWADs.
    static readonly PWADMarkerNames = [
        "FF_START", "FF_END",
    ];
    // The name of the marker at the beginning of the custom flat namespace.
    static readonly PWADMarkerStart = "FF_START";
    // The name of the marker at the end of the custom flat namespace.
    static readonly PWADMarkerEnd = "FF_END";
    // The name of the flat.
    name: string;
    // The flat's pixel data.
    // Pixel data is 4096 bytes long (flats are always 64 pixels by 64 pixels).
    // The pixels are stored by ascending order on the X axis and then by
    // ascending order on the Y axis. Each pixel is a byte indicating the
    // color map index that should be used when displaying that pixel.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a flat.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.category === WADCategory.Flats && lump.length === 4096;
    }
    
    // Create a WADFlat given a WADLump object.
    static from(lump: WADLump): WADFlat {
        if(!this.match(lump)){
            throw new Error("Not a valid flat lump.");
        }
        return new WADFlat(lump.name, lump.data as Buffer);
    }
    
    // Get the width of the flat in pixels.
    get width(): number {
        return 64;
    }
    
    // Get the height of the flat in pixels.
    get height(): number {
        return 64;
    }
    
    // Get the pixel color index at a coordinate.
    getPixel(x: number, y: number): number {
        return this.data.readUInt8(x + (64 * y));
    }
    
    // Set the pixel color index at a coordinate.
    setPixel(x: number, y: number, color: number): void {
        this.data.writeUInt8(color, x + (64 * y));
    }
    
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(colors: WADColors): Buffer {
        // Create the pixel data: 64 * 64 pixels * 4 color channels
        const data: Buffer = Buffer.alloc(16384);
        // Fill the array
        for(let pixelIndex: number = 0; pixelIndex < 4096; pixelIndex++){
            const colorIndex: number = this.data.readUInt8(pixelIndex);
            const colorRGBA: number = colors.getColorRGBA(colorIndex);
            data.writeUInt32LE(colorRGBA, 4 * pixelIndex);
        }
        // All done
        return data;
    }
    
    // Get pixel data in indexed (index + alpha) format, stored in row-major
    // format
    getPixelDataIndexed(): Buffer {
        // Create the pixel data: 64 * 64 pixels * 3 color channels
        const data: Buffer = Buffer.alloc(12288);
        // Fill the array
        for(let pixelIndex: number = 0; pixelIndex < 4096; pixelIndex++){
            const colorIndex: number = this.data.readUInt8(pixelIndex);
            const alpha = 255;
            // Combine the alpha and index before writing
            const color = ((alpha << 8) | colorIndex);
            data.writeUInt16LE(color, 3 * pixelIndex);
        }
        // All done
        return data;
    }
    
    // Tell whether or not this flat has transparent pixels in it.
    isTransparent() {
        // Flats are just 4096 bytes, each byte mapping to a palette index, so no pixels are transparent.
        return false;
    }
}

export default WADFlat;
