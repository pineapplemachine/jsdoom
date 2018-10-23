import * as fs from "fs";
import * as path from "path";

import {WADFile} from "@src/wad/file";
import {downloadTestWad} from "@test/download";

// This function reads a WAD and then writes it back to a new file path,
// and then verifies that the input and output files are byte-identical.
// The function returns normally on success and throws an Error on failure.
export async function openTestWad(
    wadPath: string, wadName: string
): Promise<WADFile> {
    // Check if the file exists and attempt to download it if not
    const filePath = path.join(wadPath, wadName);
    if(!fs.existsSync(filePath)){
        await downloadTestWad(wadPath, wadName);
    }
    // Read the WAD file
    console.log(`Loading WAD from path "${filePath}"...`);
    const fileData: Buffer = fs.readFileSync(filePath);
    const file: WADFile = new WADFile(filePath, fileData);
    // Log data about the WAD file (more if the "verbose" flag is set)
    console.log(`Finished loading WAD file. (Found ${file.lumps.length} lumps.)`);
    console.log(`Lumps in the WAD were padded? ${file.padLumps}`);
    // All done
    return file;
}

export default openTestWad;
