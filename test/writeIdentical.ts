import * as fs from "fs";

import {WADFile} from "@src/wad/file";
import {openTestWad} from "@test/open";

// This function reads a WAD and then writes it back to a new file path,
// and then verifies that the input and output files are byte-identical.
// The function returns normally on success and throws an Error on failure.
export async function testWriteIdentical(
    wadPath: string, wadName: string
): Promise<void> {
    // Read the WAD file
    const wad: WADFile = await openTestWad(wadPath, wadName);
    // Save the WAD file
    const saveFilePath = wad.path + ".copy";
    console.log(`Writing a copy to path "${saveFilePath}"...`);
    await wad.saveFile(saveFilePath);
    console.log("Finished writing WAD file.");
    // Make sure the input and output files are identical
    // Fail the test if the files are different
    console.log("Checking if WAD files are identical...");
    const readBuffer = fs.readFileSync(wad.path);
    const savedBuffer = fs.readFileSync(saveFilePath);
    if(readBuffer.equals(savedBuffer)){
        console.log("OK: Files are IDENTICAL.");
    }else{
        console.log("NO: Files are DIFFERENT.");
        throw new Error("Files are different.");
    }
}

export default testWriteIdentical;
