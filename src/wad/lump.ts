import {WADFile} from "@src/wad/file";

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
    
    constructor(options: {
        file: (WADFile | null),
        name: string,
        data: (Buffer | null),
        directoryOffset?: number,
        dataOffset?: number,
        dataLength?: number,
        noDataOffset?: boolean,
    }) {
        this.file = options.file;
        this.name = options.name;
        this.data = options.data;
        this.directoryOffset = options.directoryOffset || 0;
        this.dataOffset = options.dataOffset || 0;
        this.dataLength = options.dataLength || 0;
        this.noDataOffset = options.noDataOffset || false;
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
    
    // Returns the lump before this one in the containing WAD file.
    // Returns null if this was the first lump in the file, or if the lump
    // doesn't actually belong to any file.
    getPreviousLump(): (WADLump | null) {
        if(!this.file){
            return null;
        }
        for(let index: number = 0; index < this.file.lumps.length; index++){
            if(this.file.lumps[index] === this){
                return index === 0 ? null : this.file.lumps[index - 1];
            }
        }
        return null;
    }
    
    // Returns the lump after this one in the containing WAD file.
    // Returns null if this was the first lump in the file, or if the lump
    // doesn't actually belong to any file.
    getNextLump(): (WADLump | null) {
        if(!this.file){
            return null;
        }
        const lastIndex = this.file.lumps.length - 1;
        for(let index: number = 0; index < this.file.lumps.length; index++){
            if(this.file.lumps[index] === this){
                return index >= lastIndex ? null : this.file.lumps[index + 1];
            }
        }
        return null;
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
