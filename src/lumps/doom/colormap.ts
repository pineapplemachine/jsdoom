import {DataBuffer} from "@src/types/dataBuffer";
import {WADLump} from "@src/wad/lump";
import {WADPalette} from "@src/lumps/doom/playpal";

import {DoomColormapData} from "@src/lumps/doom/defaultColormap";
import {DoomColormapNames} from "@src/lumps/doom/colormapNames";

// Represents a color map, e.g. as read from a COLORMAP lump.
// A Doom COLORMAP lump normally contains 34 maps.
// The color map describes what palette color graphics should use under
// given circumstances.
// Doom has a map for each light level (32 total), one for the godsphere,
// and one unused all-black map.
// See: http://doom.wikia.com/wiki/COLORMAP
export class WADColorMap {
    // Color map lumps are always named "COLORMAP".
    static readonly LumpName: string = "COLORMAP";
    // Contains data for a default COLORMAP to use when no other is available.
    static readonly DefaultData: DataBuffer = DoomColormapData;
    // Index of the megasphere (invulnerability) color map.
    static readonly Invulnerable: number = 32;
    // A list of human-readable descriptions for each colormap's purpose
    // as it pertains to Doom.
    static readonly DoomColormapNames: string[] = DoomColormapNames;
    
    // The binary data representing this colormap.
    data: DataBuffer;
    
    constructor(data: DataBuffer) {
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a COLORMAP.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.name.toUpperCase() === WADColorMap.LumpName && !!(
            lump.length && (lump.length % 256 === 0)
        );
    }
    
    // Create a WADColorMap given a WADLump object.
    static from(lump: WADLump): WADColorMap {
        if(!this.match(lump)){
            throw new Error("Not a valid COLORMAP lump.");
        }
        return new WADColorMap(lump.data as DataBuffer);
    }
    
    // Load the Doom 1 color map.
    static getDefault(): WADColorMap {
        return new WADColorMap(WADColorMap.DefaultData);
    }
    
    // Get the number of maps contained in this COLORMAP.
    getMapCount(): number {
        return Math.floor(this.data.length / 256);
    }
    
    // Get the color at a map index and a color index.
    // Returns a color as a palette (PLAYPAL) index.
    getColor(mapIndex: number, colorIndex: number): number {
        const byteIndex = colorIndex + (256 * mapIndex);
        if(byteIndex < 0 || byteIndex >= this.data.length){
            throw new Error("Index out of range.");
        }
        return this.data.readUInt8(byteIndex);
    }
    
    // Set the color at a map and color index.
    // Accepts a palette (PLAYPAL) index.
    setColor(mapIndex: number, colorIndex: number, color: number): void {
        const byteIndex = colorIndex + (256 * mapIndex);
        if(byteIndex < 0 || byteIndex >= this.data.length){
            throw new Error("Index out of range.");
        }
        this.data.writeUInt8(color, byteIndex);
    }
    
    // Get the color maps as pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(playpal: WADPalette, palIndex: number = 0): DataBuffer {
        // Create the pixel data: 16 * 16 pixels * N maps * 4 color channels
        const maps: number = this.getMapCount();
        const data: DataBuffer = DataBuffer.alloc(1024 * maps);
        // Fill the array. TODO: Can this be optimized?
        const total: number = this.data.length;
        for(let colorIndex: number = 0; colorIndex < total; colorIndex++){
            const index: number = this.data.readUInt8(colorIndex);
            const rgba: number = playpal.getColorRGBA(palIndex, index);
            data.writeUInt32LE(rgba, 4 * colorIndex);
        }
        // All done
        return data;
    }
}

export default WADColorMap;
