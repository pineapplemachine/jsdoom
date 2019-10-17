import {WADFile} from "@src/wad/file";
import {WADLump, WADCategory} from "@src/wad/lump";

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
    
    constructor(lumps?: WADLumpMapObject) {
        this.lumps = lumps || {};
    }
    
    // Add a single lump to the map.
    // Lumps should be added from the first loaded file to the last loaded
    // file and, within each file, from the first lump to the last lump.
    addLump(lump: WADLump): void {
        const upperName: string = lump.name.toUpperCase();
        if(this.lumps[upperName]){
            this.lumps[upperName].push(lump);
        }else{
            this.lumps[upperName] = [lump];
        }
    }
    
    // Add all the lumps in one WAD file to the map.
    addFile(file: WADFile): void {
        for(const lump of file.lumps){
            this.addLump(lump);
        }
    }
    
    // Add multiple files at once.
    addFiles(files: WADFile[]): void {
        for(const file of files){
            this.addFile(file);
        }
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
    get(name: string, category?: WADCategory): (WADLump | null) {
        const upperName: string = name.toUpperCase();
        if(this.lumps[upperName]){
            const list = this.lumps[upperName];
            if(category){
                // Filter lumps in the list by namespace
                const categoryLumps = list.filter(
                    (lump) => lump.category === category);
                console.log(`Category: ${WADCategory[category]}`, list, categoryLumps);
                if(categoryLumps.length > 0){
                    return categoryLumps[categoryLumps.length - 1];
                }else{
                    return null;
                }
            }
            return list[list.length - 1];
        }else{
            return null;
        }
    }
}

export default WADLumpMap;
