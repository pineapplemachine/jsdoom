import * as UPNG from "upng-js";

import {WADFileList} from "@src/wad/fileList";

import {WADColors} from "@src/lumps/doom/colors";
import {WADFlat} from "@src/lumps/doom/flat";
import {WADPicture} from "@src/lumps/doom/picture";
import {WADTexture} from "@src/lumps/doom/textures";
import {WADPng} from "@src/lumps/zdoom/png";

export type WADGraphic = (WADFlat | WADPicture | WADTexture | WADPng);

// Helper to get base-64 encoded PNG data from a Doom graphic.
// This is used to display images in the browser.
// TODO: Possibly cache the results?
export function getPng64(files: WADFileList, graphic: WADGraphic): string {
    if(graphic instanceof WADFlat){
        const colors: WADColors = files.getColors();
        const pixels: Buffer = graphic.getPixelDataRGBA(colors);
        return getPng64FromPixelData(pixels, graphic.width, graphic.height);
    }else if(graphic instanceof WADPicture){
        const colors: WADColors = files.getColors();
        const pixels: Buffer = graphic.getPixelDataRGBA(colors);
        return getPng64FromPixelData(pixels, graphic.width, graphic.height);
    }else if(graphic instanceof WADTexture){
        const pixels: Buffer = graphic.getPixelDataRGBA(files);
        return getPng64FromPixelData(pixels, graphic.width, graphic.height);
    }else if(graphic instanceof WADPng){
        const pngString: string = String.fromCharCode(...graphic.data);
        const data64: string = btoa(pngString);
        return `data:image/png;base64,${data64}`;
    }else{
        throw new Error("Unknown graphic type.");
    }
}

// Helper used by getPng64 function
// Accepts an RGBA pixels buffer and the image dimensions.
// Outputs base-64 encoded PNG data for display e.g. in an `img` DOM element.
function getPng64FromPixelData(
    pixels: Buffer, width: number, height: number
): string {
    const png: ArrayBuffer = UPNG.encode([pixels.buffer], width, height, 0);
    // TODO: Is this *really* the best way to do this?
    const data64: string = btoa(String.fromCharCode(...new Uint8Array(png)));
    return `data:image/png;base64,${data64}`;
}

export default getPng64;
