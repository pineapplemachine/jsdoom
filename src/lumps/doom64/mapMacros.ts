import {WADLump} from "@src/wad/lump";

// Doom 64 has "macros" for level scripting. Each line can optionally run a
// macro script along with its main action.

// Represents an individual action in a macro script.
export interface MacroAction {
    lineTag: number;
    sectorTag: number;
    action: number;
}

// Represents an event in a macro script, which consists of a bunch of actions
// run sequentially.
export interface MacroEvent {
    actionCount: number;
    actions: MacroAction[];
}

// Represents a MACROS lump for a Doom 64 map
export class WADMapMacros {
    // Total number of events
    eventTotal: number;
    // Total number of actions
    actionTotal: number;
    // Macro scripts
    events: MacroEvent[];
    
    constructor(data: Buffer){
        let offset: number = 4; // Start at first event
        this.eventTotal = data.readUInt16LE(0);
        this.actionTotal = data.readUInt16LE(2);
        this.events = [];
        let actionsParsed = 0;
        // Read each macro event
        for(let curEvent = 0; curEvent < this.eventTotal; curEvent++){
            const actionCount = data.readUInt16LE(offset);
            offset += 2;
            const actions: MacroAction[] = [];
            // Read each action in the macro
            for(let curAction = 0; curAction <= actionCount; curAction++){
                const lineTag = data.readUInt16LE(offset);
                offset += 2;
                const sectorTag = data.readUInt16LE(offset);
                offset += 2;
                const action = data.readUInt16LE(offset);
                offset += 2;
                actions.push({lineTag, sectorTag, action});
                actionsParsed += 1;
            }
            this.events.push({actionCount, actions});
        }
        if(actionsParsed !== this.actionTotal){
            console.warn("actionsParsed !== this.actionTotal");
        }
    }
    
    // Checks whether the given lump qualifies as a MACROS lump
    static match(lump: WADLump): boolean {
        return lump.length >= 4 && lump.name === "MACROS";
    }
}
