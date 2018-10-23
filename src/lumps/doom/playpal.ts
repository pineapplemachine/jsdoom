import {WADLump} from "@src/wad/lump";

import {DoomPlaypalData} from "@src/lumps/doom/defaultPlaypal";

// Represents a single 24-bit color within a PLAYPAL lump.
export interface WADPaletteColor {
    red: number;
    green: number;
    blue: number;
}

// Represents a set of palettes to be used with Doom-format graphics,
// e.g. those read from a PLAYPAL lump.
// Each palette is 768 bytes long, containg 256 24-bit RGB color values.
// A Doom PLAYPAL lump contains 14 palettes.
// A Hexen PLAYPAL lump contains 28 palettes.
// See: http://doom.wikia.com/wiki/PLAYPAL
export class WADPalette {
    // Palette lumps are always named "PLAYPAL".
    static readonly LumpName: string = "PLAYPAL";
    // Location of "playpal.lmp", relative to the root `jsdoom-tools` directory
    static readonly DefaultData: Buffer = DoomPlaypalData;
    
    // The binary data representing this playpal.
    data: Buffer;
    
    constructor(data: Buffer) {
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a PLAYPAL.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.name.toUpperCase() === WADPalette.LumpName && !!(
            lump.length && (lump.length % 768 === 0)
        );
    }
    
    // Create a WADPalette given a WADLump object.
    static from(lump: WADLump): WADPalette {
        if(!this.match(lump)){
            throw new Error("Not a valid PLAYPAL lump.");
        }
        return new WADPalette(<Buffer> lump.data);
    }
    
    // Load the Doom 1 palette.
    static getDefault(): WADPalette {
        return new WADPalette(WADPalette.DefaultData);
    }
    
    // Get the number of palettes
    getPaletteCount(): number {
        return Math.floor(this.data.length / 768);
    }
    
    // Get the total number of colors, i.e. number of palettes * 256 colors.
    getColorCount(): number {
        return Math.floor(this.data.length / 3);
    }
    
    // Get the color at a palette and color index.
    // Returns an object with "red", "green", and "blue" attributes.
    getColor(palIndex: number, colorIndex: number): WADPaletteColor {
        const byteIndex: number = (3 * colorIndex) + (768 * palIndex);
        if(byteIndex < 0 || byteIndex >= this.data.length){
            throw new Error("Index out of range.");
        }
        return {
            red: this.data.readUInt8(byteIndex),
            green: this.data.readUInt8(byteIndex + 1),
            blue: this.data.readUInt8(byteIndex + 2),
        }
    }
    
    // Get the color at a palette and color index.
    // The color is represented as a 4-byte RGBA value.
    // The alpha channel is always 0xff.
    getColorRGBA(palIndex: number, colorIndex: number): number {
        const byteIndex: number = (3 * colorIndex) + (768 * palIndex);
        if(byteIndex < 0 || byteIndex >= this.data.length){
            throw new Error("Index out of range.");
        }
        const red = this.data.readUInt8(byteIndex);
        const green = this.data.readUInt8(byteIndex + 1);
        const blue = this.data.readUInt8(byteIndex + 2);
        return 0xff000000 + red + (green << 8) + (blue << 16);
    }
    
    // Get the color at a palette and color index.
    // The color is represented as a 4-byte BGRA value.
    // The alpha channel is always 0xff.
    getColorBGRA(palIndex: number, colorIndex: number): number {
        const byteIndex: number = (3 * colorIndex) + (768 * palIndex);
        if(byteIndex < 0 || byteIndex >= this.data.length){
            throw new Error("Index out of range.");
        }
        const red = this.data.readUInt8(byteIndex);
        const green = this.data.readUInt8(byteIndex + 1);
        const blue = this.data.readUInt8(byteIndex + 2);
        return 0xff000000 + (red << 16) + (green << 8) + blue;
    }
    
    // Set the color at a palette and color index.
    setColor(
        palIndex: number, colorIndex: number, color: WADPaletteColor
    ): void {
        const byteIndex: number = (3 * colorIndex) + (768 * palIndex);
        if(byteIndex < 0 || byteIndex >= this.data.length){
            throw new Error("Index out of range.");
        }
        this.data.writeUInt8(color.red, byteIndex);
        this.data.writeUInt8(color.green, byteIndex + 1);
        this.data.writeUInt8(color.blue, byteIndex + 2);
    }
    
    // Get the palettes as pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(): Buffer {
        // Create the pixel data: 16 * 16 pixels * N palettes * 4 color channels
        const data: Buffer = Buffer.alloc(1024 * this.getPaletteCount());
        // Fill the array. TODO: Optimize (after revising Buffer use)
        const total: number = this.getColorCount();
        for(let colorIndex: number = 0; colorIndex < total; colorIndex++){
            data.writeUInt8(
                this.data.readUInt8((3 * colorIndex) + 0), (4 * colorIndex) + 0
            );
            data.writeUInt8(
                this.data.readUInt8((3 * colorIndex) + 1), (4 * colorIndex) + 1
            );
            data.writeUInt8(
                this.data.readUInt8((3 * colorIndex) + 2), (4 * colorIndex) + 2
            );
            data.writeUInt8(0xff, (4 * colorIndex) + 3);
        }
        // All done
        return data;
    }
}

export default WADPalette;
