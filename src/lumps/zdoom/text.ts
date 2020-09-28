// This module is for generic text parsers

// An interface which serves the same purpose as a C/C++ string pointer
interface StringPointer {
    // The string
    data: string;
    // The location
    location: number;
}

interface HandledEscape {
    // The string data to be inserted in place of the escape sequence
    data: string;
    // The length of the escape sequence, not including backslash
    forward: number;
}

export class ZParser {
    // The text data as a string
    data: string;
    // Parser position
    position: number;
    // Handlers for escape sequences within strings of text. A pointer 
    static escapeHandlers: {[char: string]: (pointer: StringPointer) => HandledEscape} = {
        "0": ZParser.parseOctal,
        "1": ZParser.parseOctal,
        "2": ZParser.parseOctal,
        "3": ZParser.parseOctal,
        /*
        // Octal numbers >= 400 are >= 256 in decimal
        "4": ZParser.parseOctal,
        "5": ZParser.parseOctal,
        "6": ZParser.parseOctal,
        "7": ZParser.parseOctal,
        */
        "a": (pointer) => {return {data: "", forward: 1}; },
        "b": (pointer) => {return {data: "", forward: 1}; },
        "c": (pointer) => {
            const colourChar = pointer.data[pointer.location];
            // Color is from TEXTCOLO
            if(colourChar === "["){
                let length = 1;
                let location = pointer.location;
                while(pointer.data[location] !== "]"){
                    location += 1;
                    length += 1;
                }
                return {data: "", forward: length};
            }
            return {data: "", forward: 1};
        },
        "f": (pointer) => {return {data: "", forward: 1}; },
        "n": (pointer) => {return {data: "\n", forward: 1}; },
        "r": (pointer) => {return {data: "\r", forward: 1}; },
        "t": (pointer) => {return {data: "\t", forward: 1}; },
        "v": (pointer) => {return {data: "\n", forward: 1}; },
        "x": (pointer) => {
            const hexDigits = pointer.data.substring(pointer.location + 1, pointer.location + 3);
            const hex = Number.parseInt(hexDigits, 16);
            return {data: String.fromCharCode(hex), forward: 3};
        },
        "?": (pointer) => {return {data: "", forward: 1}; },
        "\n": (pointer) => {return {data: "", forward: 1}; }, // Ignore actual newline
    };

    static parseOctal(pointer: StringPointer): HandledEscape {
        const octalDigits = pointer.data.substring(pointer.location, pointer.location + 3);
        const octal = Number.parseInt(octalDigits, 8);
        // Octal escapes are limited to ASCII
        if(octal <= 255){
            return {
                data: String.fromCharCode(octal),
                forward: 3,
            };
        }
        return {data: "", forward: 3};
    }

    constructor(data: Buffer, start: number = 0){
        this.data = data.toString();
        this.position = start;
    }

    parseZString(at: number): string {
        let location = at;
        let advance = 0;
        if(this.data[location] === "\""){
            advance += 1;
            location += 1;
        }
        // The next character is "escaped"
        let escape: boolean = false;
        let lastEscapeEnd = location;
        let sinceEscape = 0;
        let text = "";
        // Strings must be enclosed within quotation marks. However, some
        // strings can have quotation marks within them if they are prefixed
        // with a backslash
        while(this.data[location + advance] !== "\"" || escape){
            if(escape){
                text += this.data.substring(lastEscapeEnd, sinceEscape);
                const escapeChar = this.data[location + advance];
                if(ZParser.escapeHandlers.hasOwnProperty(escapeChar)){
                    const escapeData = ZParser.escapeHandlers[escapeChar]({data: this.data, location: location + advance});
                    text += escapeData.data;
                    advance += escapeData.forward - 1;
                }else{
                    text += escapeChar;
                }
                lastEscapeEnd = location + advance;
            }else if(this.data[location + advance] === "\\"){
                escape = true;
                sinceEscape -= 1;
            }
            advance += 1;
            sinceEscape += 1;
        }
        return text;
    }
}
