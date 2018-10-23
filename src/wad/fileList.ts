import {WADLump} from "@src/wad/lump";
import {WADLumpMap} from "@src/wad/lumpMap";
import {WADFile} from "@src/wad/file";

import {WADColorMap} from "@src/lumps/doom/colormap";
import {WADColors} from "@src/lumps/doom/colors";
import {WADPalette} from "@src/lumps/doom/playpal";

export class WADFileList {
    // The list of files, ordered from first in the load order to last.
    files: WADFile[];
    // A map for quickly retrieving lumps by name.
    map: WADLumpMap;
    
    constructor(files?: WADFile[]) {
        this.files = files || [];
        this.map = new WADLumpMap();
        if(files){
            this.map.addFiles(files);
        }
    }
    
    // Add a single WAD file to the end of the list.
    // IWAD should be added first and PWADs last.
    addFile(file: WADFile): void {
        this.files.push(file);
        this.map.addFile(file);
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
