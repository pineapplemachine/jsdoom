import {ZParser} from "./text";

interface StringPointer {
    // The string
    data: string;
    // The location
    location: number;
}

interface KeyValuePair {
    key: string;
    value: string;
}

type UDMFData = string | number | boolean;

interface Dictionary {
    [name: string]: UDMFData;
}

interface Thing extends Dictionary {
    // The thing's ID
    id: number;
    // X position
    x: number;
    // Y position
    y: number;
    // Height from floor
    height: number;
    // Direction thing is facing
    angle: number;
    // DoomEdNum
    type: number;
    skill1: boolean;
    skill2: boolean;
    skill3: boolean;
    skill4: boolean;
    skill5: boolean;
    ambush: boolean;
    single: boolean;
    dm: boolean;
    coop: boolean;
    friend: boolean; // MBF
    dormant: boolean;
    class1: boolean;
    class2: boolean;
    class3: boolean;
    standing: boolean; // Strife
    strifeally: boolean; // Strife
    translucent: boolean; // Strife
    invisible: boolean; // Strife
    special: number;
    arg0: number;
    arg1: number;
    arg2: number;
    arg3: number;
    arg4: number;
    comment: string;
}

export class WADUDMFMapThing implements Thing {
    [name: string]: UDMFData;
    id: number;
    x: number;
    y: number;
    height: number;
    angle: number;
    type: number;
    skill1: boolean;
    skill2: boolean;
    skill3: boolean;
    skill4: boolean;
    skill5: boolean;
    ambush: boolean;
    single: boolean;
    dm: boolean;
    coop: boolean;
    friend: boolean; // MBF
    dormant: boolean;
    class1: boolean;
    class2: boolean;
    class3: boolean;
    standing: boolean; // Strife
    strifeally: boolean; // Strife
    translucent: boolean; // Strife
    invisible: boolean; // Strife
    special: number;
    arg0: number;
    arg1: number;
    arg2: number;
    arg3: number;
    arg4: number;
    comment: string;

    constructor(options: Thing){
        this.id = options.id;
        this.x = options.x;
        this.y = options.y;
        this.height = options.height;
        this.angle = options.angle;
        this.type = options.type;
        this.skill1 = options.skill1;
        this.skill2 = options.skill2;
        this.skill3 = options.skill3;
        this.skill4 = options.skill4;
        this.skill5 = options.skill5;
        this.ambush = options.ambush;
        this.single = options.single;
        this.dm = options.dm;
        this.coop = options.coop;
        this.friend = options.friend;
        this.dormant = options.dormant;
        this.class1 = options.class1;
        this.class2 = options.class2;
        this.class3 = options.class3;
        this.standing = options.standing;
        this.strifeally = options.strifeally;
        this.translucent = options.translucent;
        this.invisible = options.invisible;
        this.special = options.special;
        this.arg0 = options.arg0;
        this.arg1 = options.arg1;
        this.arg2 = options.arg2;
        this.arg3 = options.arg3;
        this.arg4 = options.arg4;
        this.comment = options.comment;
    }
}

// A parser for UDMF map data
export class WADTextmapParser extends ZParser {
    parseKeyValuePair(at: StringPointer): KeyValuePair | null {
        // Parse the key
        let location = at.location;
        const keyRegex = /(\S+)\s*=\s*/ym;
        const numRegex = /-?(\d*.\d+(e\d+)?|\d+)/ym; // Regex for float/int values
        keyRegex.lastIndex = location;
        let result: string[] | null = keyRegex.exec(at.data);
        if(!result){
            return null;
        }
        const key = result[1];
        let advance = 0;
        let value: string = "";
        if(key){
            advance += key.length;
            location += advance;
            if(at.data[location] === "t" || at.data[location] === "T"){
                value = "true";
            }else if(at.data[location] === "f" || at.data[location] === "F"){
                value = "false";
            }else if(at.data[location] === "-" || !Number.isNaN(Number.parseInt(at.data[location], 10)) || at.data[location] === "."){
                numRegex.lastIndex = location;
                result = numRegex.exec(at.data);
                if(!result){
                    return null;
                }
                value = result[0];
            }else if(at.data[location] === "\""){
                value = this.parseZString(location);
            }
        }
        this.position += advance;
        return {key, value};
    }
}

// A text format used by zdoom. Contains all of the map data (except nodes)
// in one big text file.
export class WADTextmap {
    parser: WADTextmapParser;

    constructor(data: Buffer){
        const dstring = data.toString();
        this.parser = new WADTextmapParser(dstring);
    }
}
