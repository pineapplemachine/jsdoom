import {WADLump} from "@src/wad/lump";
import {WADLumpMap} from "@src/wad/lumpMap";
import {WADFile} from "@src/wad/wad";

import {WADColorMap} from "@src/lumps/doom/colormap";
import {WADColors} from "@src/lumps/doom/colors";
import {WADPalette} from "@src/lumps/doom/playpal";

export interface WADFileListError {
    // The path to the file relevant to this error.
    path: string;
    // The thrown Error object.
    error: Error;
}

export class WADFileList {
    // The list of files, ordered from first in the load order to last.
    files: WADFile[];
    // A list of errors encountered while loading WAD files, if any.
    errors: WADFileListError[];
    // A map for quickly retrieving lumps by name.
    map: WADLumpMap;
    
    constructor(files: WADFile[], errors?: WADFileListError[]) {
        this.files = files;
        this.errors = errors || [];
        this.map = WADLumpMap.fromWads(files);
    }
    
    // Asynchronously load files from a list of paths.
    // When resolving lump names, WADs which appeared later in the list will
    // have precedence over WADs earlier in the list.
    // The moral of the story being: IWAD first, then PWADs.
    static async loadFiles(paths: string[]): Promise<WADFileList> {
        // Keep track of files, errors, and promises...
        const files: WADFile[] = [];
        const errors: WADFileListError[] = [];
        const promises: Promise<void>[] = [];
        // Asynchronously load all of the files.
        for(const path of paths){
            promises.push(
                WADFile.loadFile(path).then(file => {
                    files.push(file);
                }).catch(error => {
                    errors.push({
                        path: path,
                        error: error,
                    });
                })
            );
        }
        // Wait for all the files to finish loading.
        await Promise.all(promises);
        // Order of promise resolution may not be guaranteed; make sure that
        // the file list is actually in the order that the paths were given.
        files.sort((a, b) => {
            return paths.indexOf(a.path) - paths.indexOf(b.path);
        });
        // All done
        return new WADFileList(files, errors);
    }
    
    // Get a PLAYPAL lump object given the list of wads or, if none of the WADs
    // contain a PLAYPAL lump, then get a default WADPalette.
    getPlaypal(): WADPalette {
        const lump: (WADLump | null) = this.map.get(WADPalette.LumpName);
        if(lump){
            return WADPalette.from(lump);
        }else{
            return WADPalette.getDefault();
        }
    }
    
    // Get a COLORMAP lump object given the list of wads or, if none of the WADs
    // contain a COLORMAP lump, then get a default WADColorMap.
    getColormap(): WADColorMap {
        const lump: (WADLump | null) = this.map.get(WADColorMap.LumpName);
        if(lump){
            return WADColorMap.from(lump);
        }else{
            return WADColorMap.getDefault();
        }
    }
    
    // Get a WADColors object containing WADPalette and WADColorMap objects
    // representing the PLAYPAL and COLORMAP lumps loaded from the WAD list.
    // If the WAD list did not include either or both lumps, then defaults
    // will be used instead.
    getColors(palIndex: number = 0, mapIndex: number = 0): WADColors {
        return new WADColors({
            playpal: this.getPlaypal(),
            palIndex: palIndex,
            colormap: this.getColormap(),
            mapIndex: mapIndex,
        });
    }    
}

export default WADFileList;
