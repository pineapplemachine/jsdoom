import * as UPNG from "upng-js";

import {DataBuffer} from "@src/types/dataBuffer";

import {WADFileList} from "@src/wad/fileList";

import {WADColors} from "@src/lumps/doom/colors";
import {WADFlat} from "@src/lumps/doom/flat";
import {WADPicture} from "@src/lumps/doom/picture";
import {WADTexture} from "@src/lumps/doom/textures";
import {WADPng} from "@src/lumps/zdoom/png";

const win: any = window as any;

export type WADGraphic = (WADFlat | WADPicture | WADTexture | WADPng);

// Base 64 digits ordered from lowest to greatest value.
export const digits64: string = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
);

// Convert the low three bytes of the input to a string of four base64 digits.
function btoa24(bits: number): string {
    return (
        digits64[(bits >> 18) & 0x3f] +
        digits64[(bits >> 12) & 0x3f] +
        digits64[(bits >> 6) & 0x3f] +
        digits64[bits & 0x3f]
    );
}

// Convert the data in a buffer to base64-encoded data represented in a string.
export function bufferbtoa(buffer: DataBuffer): string {
    let parts: string[] = [];
    let index: number = 0;
    // Process in 3-byte chunks
    while(index + 4 <= buffer.length){
        const bits = buffer.readUInt32BE(index) >> 8;
        parts.push(btoa24(bits));
        index += 3;
    }
    // Process the last 3 bytes
    if(index + 3 === buffer.length){
        const bits = (
            (buffer.readUInt16BE(index) << 8) +
            buffer.readUInt8(index + 2)
        );
        parts.push(btoa24(bits));
    // Or process the last 2 bytes
    }else if(index + 2 === buffer.length){
        const bits = buffer.readUInt16BE(index);
        parts.push(
            digits64[bits >> 10] +
            digits64[(bits >> 4) & 0x3f] +
            digits64[(bits << 2) & 0x3f] +
            "="
        );
    // Or process the last 1 byte
    }else if(index + 1 === buffer.length){
        const bits = buffer.readUInt8(index);
        parts.push(
            digits64[bits >> 2] +
            digits64[(bits << 4) & 0x3F] +
            "=="
        );
    }
    // Put it all together and return it
    return parts.join("");
}

// Helper to get base-64 encoded PNG data from a Doom graphic.
// This is used to display images in the browser.
// TODO: Possibly cache the results?
export function getPng64(files: WADFileList, graphic: WADGraphic): string {
    if(graphic instanceof WADFlat){
        const colors: WADColors = files.getColors();
        const pixels: DataBuffer = graphic.getPixelDataRGBA(colors);
        return getPng64FromPixelData(pixels, graphic.width, graphic.height);
    }else if(graphic instanceof WADPicture){
        const colors: WADColors = files.getColors();
        const pixels: DataBuffer = graphic.getPixelDataRGBA(colors);
        return getPng64FromPixelData(pixels, graphic.width, graphic.height);
    }else if(graphic instanceof WADTexture){
        const pixels: DataBuffer = graphic.getPixelDataRGBA(files);
        return getPng64FromPixelData(pixels, graphic.width, graphic.height);
    }else if(graphic instanceof WADPng){
        // const pngString: string = String.fromCharCode(...graphic.data);
        // const data64: string = btoa(pngString);
        const data64: string = bufferbtoa(graphic.data);
        return `data:image/png;base64,${data64}`;
    }else{
        throw new Error("Unknown graphic type.");
    }
}

// Helper used by getPng64 function
// Accepts an RGBA pixels buffer and the image dimensions.
// Outputs base-64 encoded PNG data for display e.g. in an `img` DOM element.
function getPng64FromPixelData(
    pixels: DataBuffer, width: number, height: number
): string {
    const png: ArrayBuffer = UPNG.encode([pixels.buffer as ArrayBuffer], width, height, 0);
    // TODO: Is this *really* the best way to do this?
    // const data64: string = btoa(String.fromCharCode(...new Uint8Array(png)));
    const data64: string = bufferbtoa(DataBuffer.from(png));
    return `data:image/png;base64,${data64}`;
}

export default getPng64;
