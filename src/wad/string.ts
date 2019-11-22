// Read a null-padded ASCII string from a data buffer at an offset
// of arbitrary length.
export function readPaddedString(
    data: Buffer, offset: number, length: number
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
export function readPaddedString8(data: Buffer, offset: number): string {
    const bytes = data.slice(offset, offset + 8);
    const text = Array.from(bytes).map((character) => {
        return String.fromCharCode(character & 0xff);
    }).join("");
    // Chop off useless bytes - Fixes Memento Mori (MM.WAD)
    for(let index: number = 0; index < 8; index++){
        if(data[index + offset] === 0){
            return text.substring(0, index);
        }
    }
    return text;
}

// Write a null-padded ASCII string to a data buffer.
export function writePaddedString(
    data: Buffer, offset: number, length: number, text: string
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
