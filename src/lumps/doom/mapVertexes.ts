import {Buffer} from "buffer";

import {WADLump} from "@src/wad/lump";

// Represets an axis-aligned box with left, right, top,
// and bottom coordinates.
// TODO: Perhaps this should live in a common module?
export class WADMapBoundingBox {
    left: number;
    right: number;
    top: number;
    bottom: number;
    
    constructor(left: number, top: number, right: number, bottom: number) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
    }
    
    // Get the total width of the box.
    get width(): number {
        return this.right - this.left;
    }
    
    // Get the total height of the box.
    get height(): number {
        return this.bottom - this.top;
    }
}

// Represents a single vertex read from a Doom format VERTEXES lump.
export class WADMapVertex {
    // Vertex X coordinate.
    x: number;
    // Vertex Y coordinate.
    y: number;
    
    constructor(options: {
        x: number,
        y: number,
    }) {
        this.x = options.x;
        this.y = options.y;
    }
}

// Represents a Doom format "VERTEXES" lump.
// See: https://doomwiki.org/wiki/Vertexdef
export class WADMapVertexes {
    // Map vertex lumps are always named "VERTEXES".
    static readonly LumpName: string = "VERTEXES";
    // The number of bytes which make up each vertex in the lump.
    static readonly ItemSize: number = 4;
    // The vertex data.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as map vertexes.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        return lump.length % WADMapVertexes.ItemSize === 0 && (
            lump.name.toUpperCase() === WADMapVertexes.LumpName
        );
    }
    
    // Create a WADMapVertexes given a WADLump object.
    static from(lump: WADLump): WADMapVertexes {
        return new WADMapVertexes(lump.name, lump.data as Buffer);
    }
    
    // Get the number of vertexes represented in the lump.
    get length(): number {
        return Math.floor(this.data.length / WADMapVertexes.ItemSize);
    }
    
    // Get the minimum and maximum X and Y vertex coordinates,
    // i.e. a minimum bounding box.
    // Returns an empty bounding box centered on the origin if there
    // were no vertexes in the lump.
    getBoundingBox(): WADMapBoundingBox {
        const length = this.length;
        // Handle the special case where there are no vertexes in the lump
        if(!length){
            return new WADMapBoundingBox(0, 0, 0, 0);
        }
        // Initialize values from the first vertex
        const first: WADMapVertex = this.getVertex(0);
        let left: number = first.x;
        let right: number = first.x;
        let top: number = first.y;
        let bottom: number = first.y;
        // Enumerate the remaining vertexes
        for(let vertexIndex: number = 1; vertexIndex < length; vertexIndex++){
            const vertex: WADMapVertex = this.getVertex(vertexIndex);
            left = Math.min(left, vertex.x);
            right = Math.max(right, vertex.x);
            top = Math.min(top, vertex.y);
            bottom = Math.max(bottom, vertex.y);
        }
        // All done
        return new WADMapBoundingBox(
            left, top, right, bottom
        );
    }
    
    // Get the vertex at an index.
    getVertex(vertexIndex: number): WADMapVertex {
        if(vertexIndex < 0 || vertexIndex >= this.length){
            throw new Error("Vertex index out of bounds.");
        }
        const vertexOffset: number = WADMapVertexes.ItemSize * vertexIndex;
        return new WADMapVertex({
            x: this.data.readInt16LE(vertexOffset),
            y: this.data.readInt16LE(vertexOffset + 2),
        });
    }
    
    // Enumerate all of the vertexes in the lump.
    *enumerateVertexes(): Iterable<WADMapVertex> {
        const length: number = this.length;
        for(let vertexIndex: number = 0; vertexIndex < length; vertexIndex++){
            yield this.getVertex(vertexIndex);
        }
    }
}

export default WADMapVertexes;
