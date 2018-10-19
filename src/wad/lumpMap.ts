import {WADFile} from "@src/wad/file";
import {WADLump} from "@src/wad/lump";

// Object interface used by the WADLumpMap implementation.
// Maps lump names to lists of so-named WAD lumps.
// Lump names are converted to upper-case before being used as keys.
export interface WADLumpMapObject {
    [name: string]: WADLump[];
}

// Map lumps by name.
export class WADLumpMap {
    // An object used to map lumps by name.
    lumps: WADLumpMapObject;
    
    constructor(lumps: WADLumpMapObject) {
        this.lumps = lumps;
    }
    
    // Create a lump map given a list of WADFile objects.
    static fromWads(files: WADFile[]): WADLumpMap {
        const lumps: WADLumpMapObject = {};
        for(const file of files){
            for(const lump of file.lumps){
                const upperName: string = lump.name.toUpperCase();
                if(lumps[upperName]){
                    lumps[upperName].push(lump);
                }else{
                    lumps[upperName] = [lump];
                }
            }
        }
        return new WADLumpMap(lumps);
    }
    
    // Get a list of all lumps matching a name.
    // Lumps are ordered according to the WAD file order - lumps from the first
    // file occur before lumps from the last file - and then are ordered from
    // first to last within the same file, if there are multiple lumps sharing
    // the same name in the same file.
    getAll(name: string): WADLump[] {
        const upperName: string = name.toUpperCase();
        return this.lumps[upperName];
    }
    
    // Get a lump by name. If there were no lumps, the function returns null.
    // If there was more than one lump by that name, then the last lump in
    // the last file with the given name is returned.
    get(name: string): (WADLump | null) {
        const upperName: string = name.toUpperCase();
        if(this.lumps[upperName]){
            const list = this.lumps[upperName];
            return list[list.length - 1];
        }else{
            return null;
        }
    }
}

export default WADLumpMap;
