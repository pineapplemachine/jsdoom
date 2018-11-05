import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import * as unzip from "unzip";

import {WADInfo, WADInfoList} from "@test/wadInfo";

// Helper to GET an HTTP url, returning a Promise.
function httpGetAsync(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        http.get(url, function(response) {
            if(response.statusCode !== 200){
                console.log(`HTTP GET failed; status code ${response.statusCode}.`);
                reject(response);
            }else{
                resolve(response);
            }
        });
    });
}

// Helper to pipe a read stream into a write stream, returning a Promise.
function streamPipeAsync(pipeFrom: any, pipeTo: any): Promise<any> {
    return new Promise((resolve, reject) => {
        pipeFrom.pipe(pipeTo);
        pipeTo.on("close", function() {
            resolve();
        });
        pipeTo.on("error", function() {
            console.log("Pipe error.");
            reject();
        });
        pipeFrom.on("error", function() {
            console.log("Pipe error.");
            reject();
        });
    });
}

// Download a WAD.
// The function is able to expand ZIP archives containing a WAD.
// This exists because there are legal and technical gotchas with including
// the actual WAD files in this code repository. There are no such gotchas
// if the files are downloaded to the user's machine from somewhere else when
// they are needed.
export async function downloadTestWad(
    testWadDirectory: string, fileName: string
): Promise<any> {
    console.log(`"${fileName}" not present. Attempting to download...`);
    const matchName = fileName.slice(0, fileName.lastIndexOf(".")).toLowerCase();
    let findWad: (WADInfo | null) = null;
    for(const tryWad of WADInfoList){
        if(tryWad.name === fileName){
            findWad = tryWad;
            break;
        }
    }
    if(!findWad){
        throw new Error(`Couldn't find a download link for "${fileName}".`);
    }
    const wad: WADInfo = findWad as WADInfo;
    console.log(`Downloading from ${wad.url} ...`);
    const downloadFileExt = wad.url.slice(
        wad.url.lastIndexOf("."), wad.url.length
    );
    const downloadFileName = (downloadFileExt === ".wad" ?
        fileName : path.join(fileName, downloadFileExt)
    );
    const downloadFilePath = path.join(testWadDirectory, downloadFileName);
    const httpResponse = await httpGetAsync(wad.url);
    const writeStream = fs.createWriteStream(downloadFilePath);
    await streamPipeAsync(httpResponse, writeStream);
    console.log(`Finished downloading file to path "${downloadFilePath}".`);
    if(downloadFileName.toLowerCase().endsWith(".zip")){
        console.log("Extracting downloaded archive...");
        const readStream = fs.createReadStream(downloadFilePath);
        await streamPipeAsync(readStream, unzip.Extract({
            path: testWadDirectory,
        }));
        console.log("Finished extracting.");
        if(wad.archivedWad && wad.archivedWad !== fileName){
            const archivedPath = path.join(testWadDirectory, wad.archivedWad);
            const copyToPath = path.join(testWadDirectory, fileName);
            console.log(`Renaming "${archivedPath}" to "${copyToPath}"...`);
            fs.renameSync(archivedPath, copyToPath);
        }
    }else if(!downloadFileName.toLowerCase().endsWith(".wad")){
        throw new Error("Unknown file type.");
    }
}

export default downloadTestWad;
