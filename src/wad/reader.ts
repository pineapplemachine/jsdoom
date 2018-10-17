// Implements helper functions for reading binary data from a WAD data buffer.
export class WADReader {
    data: Buffer;
    
    constructor(data: Buffer){
        this.data = data;
    }
    
    // Read a little-endian 32-bit signed integer from the file data.
    int(offset: number): number {
        return this.data.readInt32LE(offset);
    }
    
    // Read a null-padded ASCII string from the file data.
    padded(offset: number, length: number): string {
        let text: string = "";
        let i: number = offset;
        const end: number = offset + length;
        while(i < end){
            const char: number = this.data.readUInt8(i++);
            if(char !== 0){
                text += String.fromCharCode(char);
            }else{
                break;
            }
        }
        return text;
    }
}

export default WADReader;
