import {DataBuffer} from "@src/types/dataBuffer";
import {WADLump} from "./lump";
import {WADFileType} from "./fileType";

import {writePaddedString, readPaddedString, readPaddedString8} from "./string";

// Represents the contents of one WAD file.
export class WADFile {
    // Path or URL explaining where this file is located, or an empty string
    // if this WADFile object does not currently correspond to an actual file.
    path: string;
    // The file type. Should be either PWAD or IWAD, though the WADFileType
    // enumeration also contains an "Invalid" member.
    type: WADFileType;
    // An ordered list of the lumps which appear in this file.
    lumps: WADLump[];
    // Whether or not outputted files should include lump padding.
    // DOOM.WAD and DOOM2.WAD have this padding, but modern WAD tools typically
    // omit the padding.
    padLumps: boolean;
    
    constructor(path: string = "", data?: DataBuffer) {
        this.path = path;
        this.type = WADFileType.Invalid;
        this.lumps = [];
        this.padLumps = false;
        if(data){
            this.loadData(data);
        }
    }
    
    // Add a lump to the end of the list.
    addLump(lump: WADLump): void {
        this.lumps.push(lump);
    }
    
    // Synchronously read a WAD file from a data buffer.
    // The function will throw an error if there is a problem reading the WAD.
    loadData(data: DataBuffer): void {
        // Make sure the buffer is long enough to even contain a file header.
        if(data.length < 12){
            throw new Error("File is too small to be a valid WAD.");
        }
        // Read the file header.
        const typeName: string = readPaddedString(data, 0, 4);
        this.type = WADFileType.fromName(typeName);
        // If the file header wasn't either "IWAD" or "PWAD" then immediately
        // abort; this is not a WAD file.
        if(this.type === WADFileType.Invalid){
            throw new Error("File is corrupt or not a WAD.");
        }
        // Read the rest of the header...
        const numEntries: number = data.readUInt32LE(4);
        const directoryStart: number = data.readUInt32LE(8);
        // Read the lump directory
        let dirPosition: number = directoryStart;
        // Set lump padding to "true" by default, and switch to "false"
        // the first time any lump is found not to be aligned on a 4-byte
        // boundary.
        this.padLumps = true;
        while(this.lumps.length < numEntries && dirPosition < data.length){
            // Read lump metadata: lump name; data offset and length.
            const lumpStart: number = data.readUInt32LE(dirPosition);
            const lumpSize: number = data.readUInt32LE(dirPosition + 4);
            const lumpName: string = readPaddedString8(data, dirPosition + 8);
            const lumpEnd: number = lumpStart + lumpSize;
            // Make sure the lump metadata makes sense
            if(lumpEnd > data.length) throw new Error(
                `Malformed lump in WAD directory at offset ${dirPosition}.`
            );
            // Get a buffer representing the lump data
            const lumpData: (DataBuffer | null) = (
                lumpStart === lumpEnd ? null : data.slice(lumpStart, lumpEnd)
            );
            // Read the next lump and add it to the list
            let lump: WADLump = new WADLump({
                file: this,
                name: lumpName,
                data: lumpData,
                directoryOffset: dirPosition,
                dataOffset: lumpStart,
                dataLength: lumpSize,
                noDataOffset: lumpStart === 0,
            });
            this.addLump(lump);
            // Update padLumps flag
            if(lumpStart % 4 !== 0){
                this.padLumps = false;
            }
            // Advance to the next lump in the directory.
            dirPosition += 16;
        }
        // All done!
        return;
    }
    
    // Synchronously get a DataBuffer representing the WAD's binary file content.
    getData(): DataBuffer {
        // Get binary data for all lumps
        const lumpDataList: DataBuffer[] = [];
        for(const lump of this.lumps){
            if(lump.data){
                lumpDataList.push(lump.data);
            }
        }
        // Write the header
        const headerData: DataBuffer = DataBuffer.alloc(12);
        writePaddedString(headerData, 0, 4, WADFileType.getName(this.type));
        headerData.writeUInt32LE(this.lumps.length, 4);
        // Write the lump directory
        const directoryData: DataBuffer = DataBuffer.alloc(16 * this.lumps.length);
        let directoryIndex = 0;
        let lumpPosition = 0;
        for(let lumpIndex: number = 0; lumpIndex < this.lumps.length; lumpIndex++){
            // Write lump metadata: Data offset, length, and name.
            const lump: WADLump = this.lumps[lumpIndex];
            const lumpDataOffset: number = lump.noDataOffset ? 0 : 12 + lumpPosition;
            directoryData.writeUInt32LE(lumpDataOffset, directoryIndex);
            directoryData.writeUInt32LE(lump.length, directoryIndex + 4);
            writePaddedString(directoryData, directoryIndex + 8, 8, lump.name);
            // Advance 16 bytes in the directory buffer
            directoryIndex += 16;
            // Advance the lump byte position counter; add the lump length,
            lumpPosition += lump.length;
            // And then add padding bytes.
            // (DOOM.WAD and DOOM2.WAD align lumps on 4-byte boundaries.)
            if(this.padLumps){
                const remBytes = lump.length % 4;
                if(remBytes !== 0){
                    lumpPosition += 4 - remBytes;
                }
            }
        }
        
        // TODO: Rewrite using alloc and copy instead of concat
        
        // Insert padding bytes into the lump data buffer list.
        // Lumps are padded with the first byte of the lump data in order to be
        // consistent with padding behavior in DOOM.WAD and DOOM2.WAD.
        if(this.padLumps){
            for(
                let bufferIndex: number = lumpDataList.length - 1;
                bufferIndex >= 0; bufferIndex--
            ){
                const dataBuffer: DataBuffer = lumpDataList[bufferIndex];
                const remBytes = dataBuffer.length % 4;
                if(remBytes !== 0){
                    const padLength: number = 4 - remBytes;
                    const padByte: number = dataBuffer.readUInt8(0);
                    const padBuffer: DataBuffer = DataBuffer.alloc(padLength, padByte);
                    lumpDataList.splice(bufferIndex + 1, 0, padBuffer);
                }
            }
        }
        // Get the total length of all lump data.
        const lumpDataTotalLength = lumpDataList.reduce(
            (acc, next) => acc + next.length, 0
        );
        // Write the lump directory offset to the header.
        // Offset is [header bytes] + [total lump data bytes]
        headerData.writeUInt32LE(12 + lumpDataTotalLength, 8);
        // Concatenate all the buffers and return.
        const buffers = [headerData, ...lumpDataList, directoryData];
        const dataLength = 12 + 16 * this.lumps.length + lumpDataTotalLength;
        return DataBuffer.concat(buffers, dataLength);
    }
    
    // Get the first lump with a given name.
    // Returns null if there was no match.
    firstByName(name: string): (WADLump | null) {
        for(const lump of this.lumps){
            if(lump.name === name){
                return lump;
            }
        }
        return null;
    }
}
