import {WADColorMap} from "@src/lumps/doom/colormap";
import {WADPalette, WADPaletteColor} from "@src/lumps/doom/playpal";

// Helper for getting indexed colors given a palette and a color map.
export class WADColors {
    playpal: WADPalette;
    palIndex: number;
    colormap: WADColorMap;
    mapIndex: number;
    
    constructor(options: {
        playpal: WADPalette,
        palIndex?: number,
        colormap: WADColorMap,
        mapIndex?: number,
    }) {
        this.playpal = options.playpal;
        this.palIndex = options.palIndex || 0;
        this.colormap = options.colormap;
        this.mapIndex = options.mapIndex || 0;
    }
    
    // Load the Doom 1 palette and colormap.
    static getDefault(palIndex: number = 0, mapIndex: number = 0): WADColors {
        return new WADColors({
            playpal: WADPalette.getDefault(),
            palIndex: palIndex,
            colormap: WADColorMap.getDefault(),
            mapIndex: mapIndex,
        });
    }
    
    // Get the color corresponding to an index.
    // Returns an object with "red", "green", and "blue" attributes.
    getColor(index: number): WADPaletteColor {
        return this.playpal.getColor(
            this.palIndex, this.colormap.getColor(this.mapIndex, index)
        );
    }
    
    // Get the color corresponding to an index.
    // The color is represented as a 4-byte RGBA value.
    // The alpha channel is always 0xff.
    getColorRGBA(index: number): number {
        return this.playpal.getColorRGBA(
            this.palIndex, this.colormap.getColor(this.mapIndex, index)
        );
    }
    
    // Get the color corresponding to an index.
    // The color is represented as a 4-byte BGRA value.
    // The alpha channel is always 0xff.
    getColorBGRA(index: number): number {
        return this.playpal.getColorBGRA(
            this.palIndex, this.colormap.getColor(this.mapIndex, index)
        );
    }
}

export default WADColors;
