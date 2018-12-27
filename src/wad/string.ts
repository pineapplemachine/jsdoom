import {DataBuffer} from "@src/types/dataBuffer";
// Read a null-padded ASCII string from a data buffer at an offset
// of arbitrary length.
export function readPaddedString(
    data: DataBuffer, offset: number, length: number
): string {
    let text: string = "";
    let i: number = offset;
    const end: number = offset + length;
    while(i < end){
        const char: number = data.readUInt8(i++);
        if(char !== 0){
            text += String.fromCharCode(char);
        }else{
            break;
        }
    }
    return text;
}

// Read an 8-character null-padded ASCII string from a data buffer
// at an offset.
export function readPaddedString8(data: DataBuffer, offset: number): string {
    const low: number = data.readUInt32LE(offset);
    const high: number = data.readUInt32LE(offset + 4);
    const text: string = (
        String.fromCharCode(low & 0xff) +
        String.fromCharCode((low >> 8) & 0xff) +
        String.fromCharCode((low >> 16) & 0xff) +
        String.fromCharCode((low >> 24) & 0xff) +
        String.fromCharCode(high & 0xff) +
        String.fromCharCode((high >> 8) & 0xff) +
        String.fromCharCode((high >> 16) & 0xff) +
        String.fromCharCode((high >> 24) & 0xff)
    );
    for(let index: number = 7; index >= 0; index--){
        if(text[index] !== "\x00"){
            return text.slice(0, index + 1);
        }
    }
    return "";
}

// Write a null-padded ASCII string to a data buffer.
export function writePaddedString(
    data: DataBuffer, offset: number, length: number, text: string
): void {
    let i: number = 0;
    while(i < text.length && i < length){
        data.writeUInt8(text.charCodeAt(i), offset + i);
        i++;
    }
    while(i < length){
        data.writeUInt8(0, offset + i);
        i++;
    }
}
