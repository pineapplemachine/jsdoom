import * as fs from "fs";
import * as path from "path";

import * as UPNG from "upng-js";

import {Parser} from "@src/cli/options";

import {DataBuffer} from "@src/types/dataBuffer";
import {WADColors} from "@src/lumps/doom/colors";
import {WADColorMap} from "@src/lumps/doom/colormap";
import {WADFile} from "@src/wad/file";
import {WADFileList} from "@src/wad/fileList";
import {WADFlat} from "@src/lumps/doom/flat";
import {WADLump} from "@src/wad/lump";
import {WADPalette} from "@src/lumps/doom/playpal";
import {WADPicture} from "@src/lumps/doom/picture";

export const helpText = `
This is the jsdoom lump export utility.

Example usage:
  export-flat -iwad DOOM1.WAD -file mywad.wad -lump FLAT10
`.trim();

export const cliParser = new Parser([
    {
        name: "iwad",
        help: `Path to the IWAD file. Same as most Doom ports.`,
        type: String,
    },
    {
        name: "file",
        help: `Paths to one or more PWADs. Same as most Doom ports.`,
        type: String,
        list: true,
    },
    {
        name: "lump",
        help: `The name of the lump to export, for example "FLAT10".`,
        type: String,
    },
    {
        name: "path",
        help: `The path to write the exported file to.`,
        type: String,
    },
    {
        name: "format",
        help: `The file format to write, for example "LMP" or "PNG".`,
        type: String,
    },
    {
        name: "help",
        help: "Display this help text.",
        type: Boolean,
        flag: true,
    },
]);

function isDirectory(filePath: string): boolean {
    if(!fs.existsSync(filePath)){
        return false;
    }
    return fs.statSync(filePath).isDirectory();
}

// Loads a lump from a WAD list and exports it as a file of the most
// appropriate type. If no special format can be found for the given
// lump, then it is simply exported as a binary *.LMP file.
// Returns the path to the outputted file.
export function exportLump(options: {
    // The loaded WAD file list.
    files: WADFileList,
    // The name of the lump to export.
    lumpName: string,
    // The expected export format.
    format: string,
    // The file path to write the lump to.
    // If the path exists and refers to a directory, then the exported
    // file will be placed inside that directory.
    // If no path is provided, then a sensible default will be chosen.
    path?: string,
}): string {
    function getPath(extension: string): string {
        if(!options.path){
            return lumpName + "." + extension;
        }else if(isDirectory(options.path)){
            return path.join(options.path, lumpName + "." + extension);
        }else{
            return options.path;
        }
    }
    const files: WADFileList = options.files;
    const lumpName: string = options.lumpName;
    const format: string = (options.format || "").toUpperCase();
    const lump: (WADLump | null) = files.map.get(lumpName);
    if(!lump){
        throw new Error(`Found no lump named "${lumpName}".`);
    }
    // Export as a regular binary LMP file
    if(format === "LMP"){
        const outPath: string = getPath("LMP");
        fs.writeFileSync(outPath, lump.data);
        return outPath;
    }
    // Export playpal as PNG
    else if(WADPalette.match(lump) && (!format || format === "PNG")){
        const playpal: WADPalette = WADPalette.from(lump);
        const data: DataBuffer = playpal.getPixelDataRGBA();
        const png = UPNG.encode(
            [data.buffer as ArrayBuffer], 16, 16 * playpal.getPaletteCount(), 0
        );
        const outPath: string = getPath("PNG");
        fs.writeFileSync(outPath, Buffer.from(png));
        return outPath;
    }
    // Export colormap as PNG
    else if(WADColorMap.match(lump) && (!format || format === "PNG")){
        const colormap: WADColorMap = WADColorMap.from(lump);
        const data: DataBuffer = colormap.getPixelDataRGBA(files.getPlaypal());
        const png = UPNG.encode(
            [data.buffer as ArrayBuffer], 16, 16 * colormap.getMapCount(), 256
        );
        const outPath: string = getPath("PNG");
        fs.writeFileSync(outPath, Buffer.from(png));
        return outPath;
    }
    // Export patch, sprite, or menu graphic as PNG
    else if(WADPicture.match(lump) && (!format || format === "PNG")){
        const graphic: WADPicture = WADPicture.from(lump);
        const data: DataBuffer = graphic.getPixelDataRGBA(files.getColors());
        const colors = graphic.countColors() <= 256 ? 256 : 0;
        const png = UPNG.encode(
            [data.buffer as ArrayBuffer], graphic.width, graphic.height, colors
        );
        const outPath: string = getPath("PNG");
        fs.writeFileSync(outPath, Buffer.from(png));
        return outPath;
    }
    // Export flat as PNG
    else if(WADFlat.match(lump) && (!format || format === "PNG")){
        const graphic: WADFlat = WADFlat.from(lump);
        const data: DataBuffer = graphic.getPixelDataRGBA(files.getColors());
        const png = UPNG.encode(
            [data.buffer as ArrayBuffer], graphic.width, graphic.height, 256
        );
        const outPath: string = getPath("PNG");
        fs.writeFileSync(outPath, Buffer.from(png));
        return outPath;
    }
    // Export generic lump as LMP
    else if(!format){
        const outPath: string = getPath("LMP");
        fs.writeFileSync(outPath, lump.data);
        return outPath;
    }
    // Failure
    else{
        throw new Error(`Can't export "${lumpName}" in format "${format}".`);
    }
}

async function main(): Promise<void> {
    const args = cliParser.parse();
    if(args.help){
        cliParser.showHelp(helpText);
    }else{
        if(!args.lump){
            throw new Error("Must specify a lump name.");
        }
        const paths: string[] = args.file || [];
        if(args.iwad){
            paths.splice(0, 0, args.iwad);
        }
        if(!paths.length){
            throw new Error("Must specify an IWAD or at least one PWAD.");
        }
        console.log("Loading WADs...");
        const files: WADFileList = new WADFileList();
        for(const path of paths){
            console.log(`Loading "${path}".`);
            const data: Buffer = fs.readFileSync(path);
            const dbuf: DataBuffer = DataBuffer.from(data);
            const file: WADFile = new WADFile(path, dbuf);
            files.addFile(file);
        }
        console.log("Finished loading WADs.");
        console.log(`Exporting lump "${args.lump}".`);
        const outPath: string = exportLump({
            files: files,
            lumpName: args.lump,
            format: args.format,
            path: args.path,
        });
        console.log(`Finished exporting "${args.lump}" to "${outPath}".`);
    }
}

if(typeof(require) !== 'undefined' && require.main === module){
    main().then(() => {}).catch((error: Error) => {
        console.log(error.message);
        process.exit(1);
    });
}
