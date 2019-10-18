import {WADFile} from "@src/wad/file";

// The namespace a WAD lump is in.
export enum WADCategory {
    None,
    Patches,
    Flats,
    Sprites,
    End,
}

// Represents a WAD lump.
export class WADLump {
    // The WAD file to which this lump belongs, if any.
    file: (WADFile | null);
    // The name of the lump. (Up to 8 ASCII characters.)
    // Names should be treated as case-insensitive.
    name: string;
    // The lump's data buffer, or null for marker lumps.
    data: (Buffer | null);
    // Offset of the lump's header information.
    directoryOffset: number;
    // Offset of the lump's binary data content.
    dataOffset: number;
    // The number of bytes that the lump data originally contained
    // when it was read from a file.
    dataLength: number;
    // Some zero-length (marker) lumps have a data offset value of zero,
    // and some don't. This flag tells the WAD file writing logic what to do.
    noDataOffset: boolean;
    // The namespace this lump is in. A WAD can have two different lumps with
    // the same name in two different namespaces, so this is important for
    // distinguishing between them.
    // NOTE: namespace is a reserved word in Typescript, so I'm using category
    // instead.
    category: WADCategory;

    constructor(options: {
        file: (WADFile | null),
        name: string,
        data: (Buffer | null),
        directoryOffset?: number,
        dataOffset?: number,
        dataLength?: number,
        noDataOffset?: boolean,
        category?: WADCategory,
    }) {
        this.file = options.file;
        this.name = options.name;
        this.data = options.data;
        this.directoryOffset = options.directoryOffset || 0;
        this.dataOffset = options.dataOffset || 0;
        this.dataLength = options.dataLength || 0;
        this.noDataOffset = options.noDataOffset || false;
        this.category = options.category || WADCategory.None;
    }
    
    // Gets the namespace associated with this lump
    static categoryOf(name: string): WADCategory {
        const patchNamespace = /^P[123P]?_START$/;
        const flatNamespace = /^F[123F]?_START$/;
        const spriteNamespace = "S_START";
        const endNamespace = /_END$/;
        if(patchNamespace.test(name)){
            return WADCategory.Patches;
        }else if(flatNamespace.test(name)){
            return WADCategory.Flats;
        }else if(name === spriteNamespace){
            return WADCategory.Sprites;
        }else if(endNamespace.test(name)){
            return WADCategory.End;
        }
        return WADCategory.None;
    }
    
    // Get the path to the WAD containing this lump, if any.
    get filePath(): string {
        return this.file ? this.file.path : "";
    }
    
    // Get the length in bytes of this lump's data buffer.
    // Returns 0 if the lump has no data buffer.
    get length(): number {
        return this.data ? this.data.length : 0;
    }
    
    setData(data: (Buffer | null)) {
        this.data = data;
    }
    getData(): (Buffer | null) {
        return this.data;
    }
    
    // Get the index of this lump in the containing WAD file.
    // Returns -1 if the lump is not contained within any file.
    getIndex(): number {
        if(!this.file){
            return -1;
        }
        for(let index: number = 0; index < this.file.lumps.length; index++){
            if(this.file.lumps[index] === this){
                return index;
            }
        }
        return -1;
    }
    
    // Returns the lump before this one in the containing WAD file.
    // Returns null if this was the first lump in the file, or if the lump
    // doesn't actually belong to any file.
    getPreviousLump(): (WADLump | null) {
        const index: number = this.getIndex();
        if(!this.file || index <= 0){
            return null;
        }else{
            return this.file.lumps[index - 1];
        }
    }
    
    // Returns the lump after this one in the containing WAD file.
    // Returns null if this was the first lump in the file, or if the lump
    // doesn't actually belong to any file.
    getNextLump(): (WADLump | null) {
        const index: number = this.getIndex();
        if(!this.file || index < 0 || index >= this.file.lumps.length - 1){
            return null;
        }else{
            return this.file.lumps[index + 1];
        }
    }
    
    // Enumerate the lumps preceding this one in the containing WAD file.
    // Starts with the immediately prior lump and then continues up the list.
    *enumeratePreviousLumps(): Iterable<WADLump> {
        let index: number = this.getIndex();
        if(!this.file || index < 0){
            return;
        }
        while(--index >= 0){
            yield this.file.lumps[index];
        }
    }
    
    // Enumerate the lumps following this one in the containing WAD file.
    *enumerateNextLumps(): Iterable<WADLump> {
        let index: number = this.getIndex();
        if(!this.file || index < 0){
            return;
        }
        while(++index < this.file.lumps.length){
            yield this.file.lumps[index];
        }
    }
    
    // Returns true if this lump is between two lumps of the given names.
    // This can be used, for example, to determine if a lump appears between
    // "F_START" and "F_END" markers.
    isBetween(before: string, after: string): boolean {
        if(!this.file){
            return false;
        }
        let between: boolean = false;
        for(const lump of this.file.lumps){
            if(lump === this){
                return between;
            }else if(lump.name === before){
                between = true;
            }else if(lump.name === after){
                between = false;
            }
        }
        return false;
    }
    
    isBetweenMulti(before: string[], after: string[]): boolean {
        if(!this.file){
            return false;
        }
        let between: boolean = false;
        for(const lump of this.file.lumps){
            if(lump === this){
                return between;
            }else if(before.indexOf(lump.name) >= 0){
                between = true;
            }else if(after.indexOf(lump.name) >= 0){
                between = false;
            }
        }
        return false;
    }
}

export default WADLump;
