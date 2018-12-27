import {DataBuffer} from "@src/types/dataBuffer";
import {WADLump} from "@src/wad/lump";

import {WADColors} from "@src/lumps/doom/colors";

// Represents one 64 by 64 pixel graphic that is normally used to paint floors
// and ceilings.
// The exclusive use of flats to paint floors and ceilings is is a strict
// limitation in the vanilla Doom engine but the limitation is relaxed in ZDoom
// ports.
export class WADFlat {
    // The name of the flat.
    name: string;
    // The flat's pixel data.
    // Pixel data is 4096 bytes long (flats are always 64 pixels by 64 pixels).
    // The pixels are stored by ascending order on the X axis and then by
    // ascending order on the Y axis. Each pixel is a byte indicating the
    // color map index that should be used when displaying that pixel.
    data: DataBuffer;
    
    constructor(name: string, data: DataBuffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a flat.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.length === 4096;
    }
    
    // Create a WADFlat given a WADLump object.
    static from(lump: WADLump): WADFlat {
        if(!this.match(lump)){
            throw new Error("Not a valid flat lump.");
        }
        return new WADFlat(lump.name, lump.data as DataBuffer);
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
    getPixelDataRGBA(colors: WADColors): DataBuffer {
        // Create the pixel data: 64 * 64 pixels * 4 color channels
        const data: DataBuffer = DataBuffer.alloc(16384);
        // Fill the array
        for(let pixelIndex: number = 0; pixelIndex < 4096; pixelIndex++){
            const colorIndex: number = this.data.readUInt8(pixelIndex);
            const colorRGBA: number = colors.getColorRGBA(colorIndex);
            data.writeUInt32LE(colorRGBA, 4 * pixelIndex);
        }
        // All done
        return data;
    }
}

export default WADFlat;
