import {DataBuffer} from "@src/types/dataBuffer";
import {WADColorMap} from "@src/lumps/doom/colormap";
import {WADFlat} from "@src/lumps/doom/flat";
import {WADPalette} from "@src/lumps/doom/playpal";

// Get the binary contents of a bitmap (BMP) file representing this flat.
// Uses palette 0 and color map 0. (Normal tint in a fullbright sector.)
export function getFlatBitmap(options: {
    flat: WADFlat,
    playpal: WADPalette,
    palIndex?: number,
    colormap: WADColorMap,
    mapIndex?: number,
}): DataBuffer {
    // Verify input
    if(!options.flat.data){
        throw new Error("Flat has no pixel data.");
    }
    // Store options into local vars for convenience
    const flat: WADFlat = options.flat;
    const playpal: WADPalette = options.playpal;
    const palIndex: number = options.palIndex || 0;
    const colormap: WADColorMap = options.colormap;
    const mapIndex: number = options.mapIndex || 0;
    // Bitmap header: 14 bytes
    // DIB header: 40 bytes
    // Palette data: 1,024 bytes
    // Image data: 4,096 bytes
    // Total: 5,194 bytes
    const fileSize: number = 5194;
    const bmp: DataBuffer = DataBuffer.alloc(fileSize);
    // Bitmap header
    bmp.writeUInt16LE(0x4D42, 0); // "BM" file header
    bmp.writeUInt32LE(fileSize, 2); // File size
    bmp.writeUInt32LE(0, 6); // Reserved
    bmp.writeUInt32LE(1098, 10); // Offset of pixel data
    // DIB header
    bmp.writeUInt32LE(40, 14); // DIB header size in bytes
    bmp.writeUInt32LE(64, 18); // Bitmap width in pixels
    bmp.writeUInt32LE(64, 22); // Bitmap height in pixels
    bmp.writeUInt16LE(1, 26); // Number of color planes (must be 1)
    bmp.writeUInt16LE(8, 28); // Bits per pixel
    bmp.writeUInt32LE(0, 30); // Compression type (none)
    bmp.writeUInt32LE(4096, 34); // Bitmap data size
    bmp.writeUInt32LE(2834, 38); // Horizontal resolution (pixels per meter)
    bmp.writeUInt32LE(2834, 42); // Vertical resolution (pixels per meter)
    bmp.writeUInt32LE(256, 46); // Number of colors in the palette
    bmp.writeUInt32LE(0, 50); // Number of "important" colors; usually ignored
    // Palette data
    for(let i: number = 0; i < 256; i++){
        const colorIndex: number = colormap.getColor(mapIndex, i);
        const colorInt: number = playpal.getColorBGRA(palIndex, colorIndex);
        bmp.writeUInt32LE(colorInt, 54 + 4 * i);
    }
    // Image data; Pixels must be in order of ascending X and then descending Y
    // This is vertically mirrored relative to how the pixel data is stored for
    // flats; rows of pixels must be written in reverse order.
    for(let i: number = 0; i < 4096; i += 64){
        const bmpIndex = 1098 + i;
        const pixelsStart = 4032 - i;
        const pixelsEnd = 4096 - i;
        flat.data.copy(bmp, bmpIndex, pixelsStart, pixelsEnd);
    }
    // All done
    return bmp;
}
