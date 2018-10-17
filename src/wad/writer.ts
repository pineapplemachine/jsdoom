// Implements helper functions for writing binary data to a WAD data buffer.
export class WADWriter {
    data: Buffer;
    
    constructor(data: Buffer){
        this.data = data;
    }
    
    // Write a little-endian 32-bit signed integer to the data buffer.
    int(offset: number, value: number): void {
        this.data.writeInt32LE(value, offset);
    }
    
    // Write a null-padded ASCII string to the data buffer.
    padded(offset: number, length: number, text: string): void {
        let i: number = 0;
        while(i < text.length && i < length){
            this.data.writeUInt8(text.charCodeAt(i), offset + i);
            i++;
        }
        while(i < length){
            this.data.writeUInt8(0, offset + i);
            i++;
        }
    }
}

export default WADWriter;
