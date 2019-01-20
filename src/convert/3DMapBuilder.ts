import * as THREE from "three";

import {WADMap} from "@src/lumps/doom/map";
import {WADMapLine} from "@src/lumps/doom/mapLines";
import {WADMapSector} from "@src/lumps/doom/mapSectors";
import {WADTexture} from "@src/lumps/doom/textures";
import {TextureSet, TextureLibrary, isWadFlat, isWadTexture} from "@src/lumps/textureLibrary";

type nil = null | undefined;

// Absolute heights of each part of a side
interface SidePartHeights {
    // Height of top of the upper section
    upperTop: number;
    // Height of bottom of the upper section
    upperBottom: number;
    // Height of top of the lower section
    lowerTop: number;
    // Height of bottom of the lower section
    lowerBottom: number;
}

// Absolute heights of the front and back sides
interface SideHeights {
    // Absolute height of top of middle section
    middleTop: number;
    // Absolute height of bottom of middle section
    middleBottom: number;
    // Absolute heights for front side
    front: SidePartHeights;
    // Absolute heights for back side
    back: SidePartHeights;
}

// Represents a boundary between two sectors
function getSideHeights(frontSector: WADMapSector, backSector: WADMapSector): SideHeights {
    // const ceilingDiff = frontSector.ceilingHeight - backSector.ceilingHeight;
    // const floorDiff = frontSector.floorHeight - backSector.floorHeight;
    const middleTop = Math.min(
        frontSector.ceilingHeight,
        backSector.ceilingHeight
    );
    const middleBottom = Math.max(
        frontSector.floorHeight,
        backSector.floorHeight
    );
    return {
        middleTop,
        middleBottom,
        front: {
            upperTop: frontSector.ceilingHeight,
            upperBottom: middleTop,
            lowerTop: middleBottom,
            lowerBottom: frontSector.floorHeight,
        },
        back: {
            upperTop: backSector.ceilingHeight,
            upperBottom: middleTop,
            lowerTop: middleBottom,
            lowerBottom: backSector.floorHeight
        }
    };
}

// Represents a polygon join
interface PolygonJoin {
    // Index of the polygon to join
    polyIndex: number;
    // Whether or not to reverse the polygon
    reverse: boolean;
    // Whether or not to join the next polygon after or before
    after: boolean;
}

// Polygon joins
interface PolygonJoins {
    // Index of the first polygon
    firstPolyIndex: number;
    // Other polygons to join with the first one
    otherPolyJoins: PolygonJoin[];
}

// Takes line data, and converts it to polygons
class SectorPolygonBuilder {

    // The "edges" (start/end vertex of each line, as number arrays)
    private sectorEdges: number[][];
    // Number of connections to each vertex
    private vertexRefCount: {[vertex: number]: number};
    // Sector number - used to decide whether or not to put debug info in the console.
    private sector?: string;
    // Number of edges
    public get sectorEdgeCount(){
        return this.sectorEdges.length;
    }

    constructor(sectorLines: WADMapLine[], sector?: string){
        // Get sector edges
        this.sectorEdges = [];
        for(const line of sectorLines){
            this.sectorEdges.push([line.startVertex, line.endVertex]);
        }
        // Get number of references to each vertex
        this.vertexRefCount = {};
        this.sectorEdges.forEach((edge) => {
            edge.forEach((vertexIndex) => {
                if(this.vertexRefCount[vertexIndex] == null){
                    this.vertexRefCount[vertexIndex] = 1;
                }else{
                    this.vertexRefCount[vertexIndex] += 1;
                }
            });
        });
        if(sector){
            console.log(`Sector ${sector} vertexRefCount`, this.vertexRefCount);
            this.sector = sector;
        }
    }

    protected findNextGoodEdge(edgesToSkip?: number[][]): number[] | undefined {
        return this.sectorEdges.find((edge) => {
            if(edgesToSkip && edgesToSkip.includes(edge)){
                return false;
            }
            return !edge.some((vertexIndex) => this.vertexRefCount[vertexIndex] != null && this.vertexRefCount[vertexIndex] > 2);
        });
    }

    protected findNextEdgeFor(edge: number[], edgesToSkip: number[][] = []): number[] | undefined {
        return this.sectorEdges.find((sectorEdge) => {
            const reversedEdge = sectorEdge.slice().reverse();
            if(edgesToSkip.includes(sectorEdge) || edgesToSkip.includes(reversedEdge)){
                return false;
            }
            /*
            // Not possible, as the polygon is not available
            const previousEdge = edgesToSkip[edgesToSkip.length - 2];
            if(previousEdge){
                if(previousEdge.some((vertexIndex) => this.vertexRefCount[vertexIndex] > 2) &&
                    sectorEdge.some((vertexIndex) => this.vertexRefCount[vertexIndex] > 2)){
                    return false; // Only allow 2 consecutive references to a vertex with more than 1 connected edge 
                }
            }
            */
            const match = sectorEdge.findIndex((vertexIndex) => edge.includes(vertexIndex));
            const mismatch = 1 - match;
            return edge.includes(sectorEdge[match]) && !edge.includes(sectorEdge[mismatch]);
        });
    }

    protected sortPolygon(polygon: number[][]): number[][] {
        if(polygon.length < 2){
            return polygon;
        }
        // Sort so that the second vertex of the current edge is the first vertex of the next edge
        for(let curEdge = 0, nextEdge = curEdge + 1; nextEdge < polygon.length; curEdge++, nextEdge++){
            if(polygon[curEdge][1] === polygon[nextEdge][0]){
                continue; // Wanted results
            }
            if(polygon[curEdge][0] === polygon[nextEdge][1]){
                // Opposite of wanted results
                polygon[curEdge].reverse();
                polygon[nextEdge].reverse();
            }
            if(polygon[curEdge][0] === polygon[nextEdge][0]){
                polygon[curEdge].reverse();
            }else if(polygon[curEdge][1] === polygon[nextEdge][1]){
                polygon[nextEdge].reverse();
            }
        }
        if(this.sector){
            console.log(`Sector ${this.sector} sorted polygon`, polygon);
        }
        return polygon;
    }

    protected isPolygonComplete(polygon: number[][]): boolean {
        return polygon[0][0] === polygon[polygon.length - 1][1];
    }

    getPolygons(): number[][][] {
        // Make a new array with the sector polygons
        // Next edge
        let nextEdge: number[] | undefined = this.findNextGoodEdge();
        // Current polygon index
        let curPolygon = 0;
        // Polygon array
        const sectorPolygons: number[][][] = [[nextEdge!]]; // e.g. Array(3) [(12)[...], (4)[...], (4)...]
        // Edges that have already been added to a polygon
        const edgesToSkip: number[][] = [nextEdge!];
        // First edge of current polygon
        let firstEdge: number[] = nextEdge!;
        // Searching backwards for a vertex
        let reverseSearch: boolean = false;
        // Search firstEdge instead of nextEdge
        let reverseSearchStart: boolean = false;
        // Search sector lines for contiguous polygons.
        for(let edgeIndex = 0; edgeIndex < this.sectorEdges.length; edgeIndex++){
            nextEdge = this.findNextEdgeFor(reverseSearchStart ? firstEdge : nextEdge!, edgesToSkip);
            reverseSearchStart = false;
            if(!nextEdge){
                // No other edges found in the current polygon. Go to the next polygon.
                this.sortPolygon(sectorPolygons[curPolygon]);
                nextEdge = this.findNextGoodEdge(edgesToSkip);
                if(!nextEdge){
                    // Polygon only has 1 or 2 edges - these edges will be connected later
                    nextEdge = this.sectorEdges.find((edge) => {
                        if(edgesToSkip.includes(edge)){
                            return false;
                        }
                        return true;
                    });
                }
                if(!nextEdge){
                    break;
                }
                sectorPolygons.push([nextEdge]);
                edgesToSkip.push(nextEdge);
                firstEdge = nextEdge;
                curPolygon += 1;
                reverseSearch = false;
            }
            if(this.sector){
                console.log(`Sector ${this.sector} polygon ${curPolygon} nextEdge`, nextEdge);
            }
            if(!reverseSearch){
                sectorPolygons[curPolygon].push(nextEdge);
            }else{
                sectorPolygons[curPolygon].unshift(nextEdge);
            }
            edgesToSkip.push(nextEdge);
            if(nextEdge && nextEdge.some((vertexIndex) => this.vertexRefCount[vertexIndex] > 2)){
                if(this.sector){
                    debugger;
                }
                if(!reverseSearch){
                    // Hit a vertex with more than 2 references - begin search backwards
                    reverseSearch = true;
                    reverseSearchStart = true;
                }else{
                    // Hit another vertex with more than 2 references - go to next polygon
                    this.sortPolygon(sectorPolygons[curPolygon]);
                    nextEdge = this.findNextGoodEdge(edgesToSkip);
                    if(!nextEdge){
                        // Polygon only has 1 or 2 edges - these edges will be connected later
                        nextEdge = this.sectorEdges.find((edge) => {
                            if(edgesToSkip.includes(edge)){
                                return false;
                            }
                            return true;
                        });
                    }
                    if(!nextEdge){
                        break;
                    }
                    sectorPolygons.push([nextEdge]);
                    edgesToSkip.push(nextEdge);
                    firstEdge = nextEdge;
                    curPolygon += 1;
                    reverseSearch = false;
                }
            }
        }
        // Sort last polygon
        this.sortPolygon(sectorPolygons[sectorPolygons.length - 1]);
        /*
        // Find incomplete polygons - that is, polygons that do not "loop".
        const incompletePolygons: number[][][] = [];
        for(let polyIndex = 0; polyIndex < sectorPolygons.length; polyIndex++){
            const polygon = sectorPolygons[polyIndex];
            if(!this.isPolygonComplete(polygon)){
                // Incomplete polygon
                for(const edge of polygon){
                    // Remove edges of incomplete polygons from edgesToSkip
                    const edgeIndex = edgesToSkip.findIndex((skipEdge) => skipEdge === edge);
                    edgesToSkip.splice(edgeIndex, 1);
                }
                // Add to incomplete polygon list
                incompletePolygons.push(polygon);
                sectorPolygons.splice(polyIndex, 1);
            }
        }
        // Find polygons that need to be joined.
        const incompletePolygonJoins: PolygonJoins[] = [];
        for(let polyIndex = 0; polyIndex < incompletePolygons.length; polyIndex++){
            // Don't join polygons that will be joined.
            if(incompletePolygonJoins.some((joins) => joins.otherPolyJoins.some((join) => join.polyIndex === polyIndex))){
                continue;
            }
            const joins: PolygonJoins = {
                firstPolyIndex: polyIndex,
                otherPolyJoins: [],
            };
            const firstPolygon = incompletePolygons[polyIndex];
            let curPolygon = firstPolygon;
            let nextPolyIndex = 0;
            while(nextPolyIndex !== -1){
                nextPolyIndex = incompletePolygons.findIndex((polygon, polyIndex) => {
                    // Don't join polygons that are already going to be joined.
                    if(joins.otherPolyJoins.some((polyJoin) => polyJoin.polyIndex === polyIndex)){
                        return false;
                    }
                    // First or last vertex of polygon matches first or last vertex of curPolygon
                    return (polygon[0][0] === curPolygon[curPolygon.length - 1][1] ||
                        polygon[polygon.length - 1][1] === curPolygon[0][0] ||
                        polygon[0][0] === curPolygon[0][0] ||
                        polygon[polygon.length - 1][1] === curPolygon[curPolygon.length - 1][1]);
                });
                if(nextPolyIndex === -1){
                    break;
                }
                const nextPolygon = incompletePolygons[nextPolyIndex];
                // First vertex of curPolygon = last vertex of nextPolygon
                if(curPolygon[0][0] === nextPolygon[nextPolygon.length - 1][1]){
                    joins.otherPolyJoins.push({
                        polyIndex: nextPolyIndex,
                        reverse: false,
                        after: false,
                    });
                // Last vertex of curPolygon = first vertex of nextPolygon
                }else if(curPolygon[curPolygon.length - 1][1] === nextPolygon[0][0]){
                    joins.otherPolyJoins.push({
                        polyIndex: nextPolyIndex,
                        reverse: false,
                        after: true,
                    });
                // First vertex of curPolygon = first vertex of nextPolygon
                }else if(curPolygon[0][0] === nextPolygon[0][0]){
                    joins.otherPolyJoins.push({
                        polyIndex: nextPolyIndex,
                        reverse: true,
                        after: false,
                    });
                // Last vertex of curPolygon = last vertex of nextPolygon
                }else if(curPolygon[curPolygon.length - 1][1] === nextPolygon[nextPolygon.length - 1][1]){
                    joins.otherPolyJoins.push({
                        polyIndex: nextPolyIndex,
                        reverse: true,
                        after: true,
                    });
                }
                curPolygon = nextPolygon;
            }
            incompletePolygonJoins.push(joins);
        }
        console.log("incompletePolyJoins", incompletePolygonJoins);
        */
        return sectorPolygons;
    }
}

// Any textured thing
interface Textured {
    // The index of the material for this thing
    materialIndex: number;
}

// Mappable thing - image or quad
interface Mappable {
    // The width of the quad/texture in map units
    width: number;
    // The height of the quad/texture in map units
    height: number;
    // The X scale of the quad or texture.
    xScale?: number;
    // The Y scale of the quad or texture.
    yScale?: number;
}

// Different alignment types for textures
enum TextureAlignment {
    // Middle texture for one-sided walls, or upper or lower texture for two-sided walls
    Normal = 0,
    // Upper texture that is not unpegged
    Upper = 1,
    // Midtexture quad
    Midtexture = 2,
    // Back-side midtexture quad
    BackMidtexture = 3,
    World = 4, // Doom 64
    LowerUnpegged = 8, // Flag
    TwoSided = 16, // Flag
}

// Generic 4-sided polygon
interface Quad extends Mappable, Textured {}

interface DoomLighting {
    // Sector light level
    lightLevel: THREE.Color;
}

/*
interface Doom64Lighting {
    // Upper and lower vertex colors (for Doom 64 style lighting)
    upperColor: THREE.Color;
    lowerColor: THREE.Color;
}

interface GZDoomLighting extends DoomLighting, Doom64Lighting {}
*/

// A quad on a line or side
interface LineQuad extends Quad, DoomLighting {
    // If the texture on the quad is unpegged
    alignment: TextureAlignment;
    // X of start vertex
    startX: number;
    // Y of start vertex
    startY: number;
    // X of end vertex
    endX: number;
    // Y of end vertex
    endY: number;
    // NOTE: The following fields are for handling walls on sloped floors
    // Absolute Z height of the bottom of the quad at the start vertex
    // startBottomHeight: number;
    // Absolute Z height of the top of the quad at the start vertex
    // startTopHeight: number;
    // Absolute Z height of the bottom of the quad at the end vertex
    // endBottomHeight: number;
    // Absolute Z height of the top of the quad at the end vertex
    // endTopHeight: number;
    // Absolute Z height of the bottom of the quad
    bottomHeight: number;
    // Absolute Z height of the top of the quad
    topHeight: number;
    // Height of the sector (ceiling height - floor height)
    sectorHeight: number;
    // Whether scaled texture offsets are applied in world space or texel space
    worldPanning: boolean;
    // The X offset of the texture on the quad
    xOffset: number;
    // The Y offset of the texture on the quad
    yOffset: number;
    // Whether or not to reverse the order of the vertices so as to make the face point in the right direction
    reverse: boolean;
}

interface SectorTriangle extends Textured {
    // Sector light level, or floor/ceiling color
    color: THREE.Color;
    // Vertices that make this triangle
    vertices: THREE.Vector2[];
    // Absolute height
    height: number;
    // The triangle normal vector
    normalVector: THREE.Vector3;
    // Whether the triangle's vertices should be reversed so as to point inwards
    reverse: boolean;
}

// A texture that may or may not be transparent. Transparent textures are rendered last.
interface TransparentTexture {
    // The texture to use
    texture: THREE.Texture;
    // Whether or not this texture is transparent
    transparent: boolean;
}

// Represents a bounding box
interface IBoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

enum BoundingBoxComparison {
    Within, // This bounding box is within the other one
    Contains, // This bounding box contains the other one
    Outside, // This bounding box is outside the other one
    Edge, // This bounding box is on the edge of the other one
}

// Class for convenient comparisons and operations for bounding boxes
class BoundingBox implements IBoundingBox {
    // Minimum/Maximum X/Y
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    constructor(minX: number, minY: number, maxX: number, maxY: number){
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    static from(vertices: THREE.Vector2[]): BoundingBox {
        let minX = vertices[0].x;
        let minY = vertices[0].y;
        let maxX = vertices[0].x;
        let maxY = vertices[0].y;
        for(const vertex of vertices){
            if(vertex.x < minX){
                minX = vertex.x;
            }
            if(vertex.y < minY){
                minY = vertex.y;
            }
            if(vertex.x > maxX){
                maxX = vertex.x;
            }
            if(vertex.y > maxY){
                maxY = vertex.y;
            }
        }
        return new BoundingBox(minX, minY, maxX, maxY);
    }

    // Determine whether this bounding box is within the other one, or otherwise contains the other one.
    compare(other: IBoundingBox): BoundingBoxComparison {
        if(this.minX < other.minX && this.maxX > other.maxX && this.minY < other.minY && this.maxY > other.maxY){
            return BoundingBoxComparison.Contains;
        }else if(other.minX < this.minX && other.maxX > this.maxX && other.minY < this.minY && other.maxY > this.maxY){
            return BoundingBoxComparison.Within;
        }else if((this.minX < other.minX && this.maxX < other.maxX) || (this.minY < other.minY && this.maxY < other.maxY)){
            return BoundingBoxComparison.Edge;
        }else{
            return BoundingBoxComparison.Outside;
        }
    }

    // Get the area of this bounding box - very simple math
    area(): number {
        const width = this.maxX - this.minX;
        const height = this.maxY - this.minY;
        return width * height;
    }
}

interface SectorPolygon {
    // The 2D vertex coordinates of the contour of this polygon
    vertices: THREE.Vector2[];
    // An array of contours representing the holes in this polygon
    holeVertices: THREE.Vector2[][];
    // The bounding box for this polygon
    boundingBox: BoundingBox;
    // Is this sector polygon a hole in another polygon?
    isHole: boolean;
}

// This class takes map data, and creates a 3D mesh from it.
export class MapGeometryBuilder {
    // The map data
    protected map: WADMap;
    // The texture library
    protected textureLibrary: TextureLibrary;
    // Texture for walls and flats with missing textures.
    private static _missingTexture: THREE.Texture | nil;
    protected _materials: {[name: string]: number};
    protected _materialArray: THREE.MeshBasicMaterial[];
    protected _materialPromises: Promise<TransparentTexture>[];
    constructor(map: WADMap, textures: TextureLibrary){
        this.map = map;
        this.textureLibrary = textures;
        this._materials = {};
        this._materialArray = [];
        this._materialPromises = [];
    }

    // Get UV coordinates for a quad
    protected getQuadUVs(
            texture: Mappable, // UV coordinates depend on texture size
            vertexIndex: number, // Index of vertex in quad
            quad: LineQuad // The data representing the quad
        ){
        // For the following 2 arrays:
        // 0 = Upper left
        // 1 = Upper right
        // 2 = Lower left
        // 3 = Lower right
        const uvFactorX = [0, 1, 0, 1];
        const uvFactorY = [0, 0, 1, 1];
        if(texture == null){
            return [uvFactorX[vertexIndex], uvFactorY[vertexIndex]];
        }
        const xScale = (texture.xScale || 1) * (quad.xScale || 1);
        const yScale = (texture.yScale || 1) * (quad.yScale || 1);
        const texelX = 1 / texture.width;
        const texelY = 1 / texture.height;
        let uvX = texelX * quad.width * xScale;
        let uvY = texelY * uvFactorY[vertexIndex] * quad.height * yScale;
        if(quad.alignment === TextureAlignment.BackMidtexture){
            uvX *= 1 - uvFactorX[vertexIndex];
        }else{
            uvX *= uvFactorX[vertexIndex];
        }
        uvX += quad.xOffset * texelX;
        if((quad.alignment !== TextureAlignment.Midtexture && quad.alignment !== TextureAlignment.BackMidtexture) || quad.height < texture.height){
            if((quad.alignment & TextureAlignment.LowerUnpegged) === TextureAlignment.LowerUnpegged){
                if(!((quad.alignment & TextureAlignment.TwoSided) === TextureAlignment.TwoSided)){
                    // Bottom of texture is at bottom of quad
                    uvY += 1 - texelY * quad.height;
                }else{
                    // Top of texture is at top of sector
                    uvY += (quad.sectorHeight - quad.height) * texelY;
                }
            }else if(quad.alignment === TextureAlignment.Upper){
                uvY += 1 - quad.height * texelY;
            }
            uvY += quad.yOffset * texelY;
        }
        return [uvX, uvY];
    }

    // Get UV coordinates for a sector vertex
    protected getSectorVertexUVs(
        position: THREE.Vector2, // 2D position of the vertex
        texture: Mappable, // UV coordinates depend on texture size
    ){
        const uvX = position.x / texture.width;
        const uvY = -position.y / texture.height;
        return [uvX, uvY];
    }

    // Get the material index for a texture in a specific set
    protected getMaterialIndex(texName: string, set: TextureSet): number {
        // Get texture, or add it if it has not already been added.
        const matName = `${set}[${texName}]`;
        let matIndex = 0;
        if(this._materials[matName] == null){
            // Texture has not been added. Add it.
            // First, create the material.
            const material = new THREE.MeshBasicMaterial({
                name: texName,
                side: THREE.FrontSide,
            });
            material.transparent = true;
            material.vertexColors = THREE.VertexColors;
            material.needsUpdate = false;
            // Asynchronously get texture. Missing textures will use an external image file.
            const texPromise = this.optionalTexture(texName, set);
            this._materialPromises.push(texPromise);
            texPromise.then((transparentTexture) => {
                transparentTexture.texture.name = texName;
                transparentTexture.texture.needsUpdate = true;
                material.map = transparentTexture.texture;
                material.transparent = transparentTexture.transparent;
                material.needsUpdate = true;
            });
            // Add the material to the index map and array. Texture map is added asynchronously.
            matIndex = this._materialArray.length;
            this._materials[matName] = matIndex;
            this._materialArray.push(material);
        }else{
            // Material already has been added, so just use it.
            matIndex = this._materials[matName];
        }
        return matIndex;
    }

    // Return a promise for a texture in the library, or a missing texture material
    protected optionalTexture(texName: string, set: TextureSet): Promise<TransparentTexture> {
        const makeTexture = (wadTexture: Mappable): THREE.DataTexture => {
            const rgba = this.textureLibrary.getRgba(texName, set);
            const threeTexture = new THREE.DataTexture(
                rgba!, wadTexture.width, wadTexture.height, THREE.RGBAFormat,
                THREE.UnsignedByteType, THREE.UVMapping,
                THREE.RepeatWrapping, THREE.RepeatWrapping,
                THREE.LinearFilter, THREE.LinearFilter, 1
            );
            if(!Number.isInteger(Math.log2(threeTexture.image.width))){
                threeTexture.wrapS = THREE.ClampToEdgeWrapping;
            }
            if(!Number.isInteger(Math.log2(threeTexture.image.height))){
                threeTexture.wrapT = THREE.ClampToEdgeWrapping;
            }
            return threeTexture;
        };
        const promise = new Promise<TransparentTexture>((res, rej) => {
            const wadTexture = this.textureLibrary.get(texName, set);
            if(wadTexture == null){
                const threeTexture = MapGeometryBuilder._missingTexture;
                if(threeTexture == null){
                    const loader = new THREE.TextureLoader();
                    loader.load("assets/textures/missing.png", (texture: THREE.Texture) => {
                        MapGeometryBuilder._missingTexture = texture;
                        texture.wrapS = Number.isInteger(Math.log2(texture.image.width)) ?
                            THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
                        texture.wrapT = Number.isInteger(Math.log2(texture.image.height)) ?
                            THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
                        texture.flipY = false;
                        texture.needsUpdate = true;
                        res({texture, transparent: false});
                    }, (progress: ProgressEvent) => console.log(progress), (error) => {
                        rej(error);
                    });
                }else{
                    res({texture: threeTexture, transparent: false});
                }
            }else if(isWadTexture(wadTexture, set)){
                const threeTexture = makeTexture(wadTexture);
                res({
                    texture: threeTexture,
                    transparent: this.textureLibrary.isTransparent(wadTexture.name, set),
                });
            }else if(isWadFlat(wadTexture, set)){
                const threeTexture = makeTexture(wadTexture);
                res({
                    texture: threeTexture,
                    transparent: false,
                });
            }
        });
        return promise;
    }

    // Turn a list of sector lines into a list of vertex indices
    protected getPolygonsFromLines(sectorLines: WADMapLine[], sector?: string): number[][][] {
        const sectorPolygonBuilder = new SectorPolygonBuilder(sectorLines, sector);
        const sectorPolygons  = sectorPolygonBuilder.getPolygons();
        if(sector){ // Debug stuff
            console.log(`sectorPolygons for sector ${sector}`, sectorPolygons);
            let sectorPolygonsCombined: number[][] = [];
            sectorPolygons.forEach((poly) => sectorPolygonsCombined = sectorPolygonsCombined.concat(poly));
            if(sectorPolygonsCombined.length !== sectorPolygonBuilder.sectorEdgeCount){
                console.log("Sector polygons is not the same length as sectorLines!", sectorLines, sectorPolygons);
            }
        }
        return sectorPolygons;
    }

    // Point-in-polygon algorithm - used to find out whether a contiguous set of vertices is a hole in a sector polygon
    public static pointInPolygon(point: THREE.Vector2, polygon: THREE.Vector2[]): boolean {
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
        // Code from https://github.com/substack/point-in-polygon/blob/96ef4abc2a623c98214618418e42a68240055f2e/index.js
        // Licensed under MIT license
        const x = point.x, y = point.y;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;
            const intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if(intersect){
                inside = !inside;
            }
        }
        return inside;
    }

    // Build the 3D mesh for the map
    public rebuild(callback?: (mesh: THREE.Mesh) => void): THREE.Mesh | null {
        if(!this.map.sides || !this.map.sectors || !this.map.lines || !this.map.vertexes){ return null; }
        // Map of sector indices to lines that form that sector
        const sectorLines: {[sector: number]: WADMapLine[]} = {};
        // Array of quads - used for rendering walls
        let wallQuads: LineQuad[] = [];
        // Vertices
        const vertices = Array.from(this.map.enumerateVertexes());
        // Construct array of quads from lines and sides
        for(const line of this.map.enumerateLines()){ // All lines are made of 1-3 quads
            const front = this.map.sides.getSide(line.frontSidedef);
            const frontSector = this.map.sectors.getSector(front.sector);
            const frontLight = new THREE.Color(`rgb(${frontSector.light}, ${frontSector.light}, ${frontSector.light})`);
            let back = null;
            const lineX = vertices[line.endVertex].x - vertices[line.startVertex].x;
            const lineY = vertices[line.endVertex].y - vertices[line.startVertex].y;
            const lineLength = Math.sqrt(lineX * lineX + lineY * lineY);
            if(!line.twoSidedFlag){
                // No back side
                if(sectorLines[front.sector] == null){
                    sectorLines[front.sector] = [];
                }
                sectorLines[front.sector].push(line);
                const lineHeight = frontSector.ceilingHeight - frontSector.floorHeight;
                const lineTexture = this.getMaterialIndex(front.middle, TextureSet.Walls);
                wallQuads.push({
                    width: lineLength,
                    height: lineHeight,
                    xOffset: front.x,
                    yOffset: front.y,
                    materialIndex: lineTexture,
                    startX: vertices[line.startVertex].x,
                    startY: -vertices[line.startVertex].y,
                    endX: vertices[line.endVertex].x,
                    endY: -vertices[line.endVertex].y,
                    bottomHeight: frontSector.floorHeight,
                    topHeight: frontSector.ceilingHeight,
                    sectorHeight: frontSector.ceilingHeight - frontSector.floorHeight,
                    alignment: line.lowerUnpeggedFlag ? TextureAlignment.LowerUnpegged : TextureAlignment.Normal,
                    worldPanning: true,
                    lightLevel: frontLight,
                    reverse: false,
                });
            }else{
                back = this.map.sides.getSide(line.backSidedef);
                const backSector = this.map.sectors.getSector(back.sector);
                const backLight = new THREE.Color(`rgb(${backSector.light}, ${backSector.light}, ${backSector.light})`);
                if(front.sector !== back.sector){
                    if(sectorLines[front.sector] == null){
                        sectorLines[front.sector] = [];
                    }
                    if(sectorLines[back.sector] == null){
                        sectorLines[back.sector] = [];
                    }
                    sectorLines[front.sector].push(line);
                    sectorLines[back.sector].push(line);
                }
                const heights = getSideHeights(frontSector, backSector);
                if(heights.middleTop - heights.middleBottom > 0){
                    const frontMidtex = this.textureLibrary.get(front.middle, TextureSet.Walls) as WADTexture | nil;
                    const backMidtex = this.textureLibrary.get(back.middle, TextureSet.Walls) as WADTexture | nil;
                    if(frontMidtex != null){
                        // Front side midtex
                        let midQuadTop = line.lowerUnpeggedFlag ?
                            heights.middleBottom + frontMidtex.height : heights.middleTop;
                        midQuadTop += front.y;
                        midQuadTop = Math.min(heights.middleTop, midQuadTop);
                        let midQuadBottom = midQuadTop - frontMidtex.height;
                        midQuadBottom = Math.max(heights.middleBottom, midQuadBottom);
                        const lineHeight = midQuadTop - midQuadBottom;
                        const alignment = TextureAlignment.Midtexture | (line.lowerUnpeggedFlag ?
                            TextureAlignment.LowerUnpegged : 0);
                        wallQuads.push({
                            width: lineLength,
                            height: lineHeight,
                            xOffset: front.x,
                            yOffset: front.y,
                            materialIndex: this.getMaterialIndex(front.middle, TextureSet.Walls),
                            startX: vertices[line.startVertex].x,
                            startY: -vertices[line.startVertex].y,
                            endX: vertices[line.endVertex].x,
                            endY: -vertices[line.endVertex].y,
                            bottomHeight: midQuadBottom,
                            topHeight: midQuadTop,
                            sectorHeight: frontSector.ceilingHeight - frontSector.floorHeight,
                            alignment,
                            worldPanning: frontMidtex.worldPanning,
                            lightLevel: backLight,
                            reverse: false,
                        });
                    }
                    if(backMidtex != null){
                        // Back side midtex
                        let midQuadTop = line.lowerUnpeggedFlag ?
                            heights.middleBottom + backMidtex.height : heights.middleTop;
                        midQuadTop += back.y;
                        midQuadTop = Math.min(heights.middleTop, midQuadTop);
                        let midQuadBottom = midQuadTop - backMidtex.height;
                        midQuadBottom = Math.max(heights.middleBottom, midQuadBottom);
                        const lineHeight = midQuadTop - midQuadBottom;
                        const alignment = TextureAlignment.BackMidtexture | (line.lowerUnpeggedFlag ?
                            TextureAlignment.LowerUnpegged : 0);
                        wallQuads.push({
                            width: lineLength,
                            height: lineHeight,
                            xOffset: back.x,
                            yOffset: back.y,
                            materialIndex: this.getMaterialIndex(back.middle, TextureSet.Walls),
                            startX: vertices[line.startVertex].x,
                            startY: -vertices[line.startVertex].y,
                            endX: vertices[line.endVertex].x,
                            endY: -vertices[line.endVertex].y,
                            bottomHeight: midQuadBottom,
                            topHeight: midQuadTop,
                            sectorHeight: backSector.ceilingHeight - backSector.floorHeight,
                            alignment,
                            worldPanning: backMidtex.worldPanning,
                            lightLevel: backLight,
                            reverse: true,
                        });
                    }
                }
                if(heights.front.upperTop > heights.front.upperBottom){
                    // Upper quad on front side
                    wallQuads.push({
                        width: lineLength,
                        height: heights.front.upperTop - heights.front.upperBottom,
                        xOffset: front.x,
                        yOffset: front.y,
                        materialIndex: this.getMaterialIndex(front.upper, TextureSet.Walls),
                        startX: vertices[line.startVertex].x,
                        startY: -vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: -vertices[line.endVertex].y,
                        bottomHeight: heights.front.upperBottom,
                        topHeight: heights.front.upperTop,
                        sectorHeight: frontSector.ceilingHeight - frontSector.floorHeight,
                        // Normal alignment is equivalent to upper unpegged
                        alignment: line.upperUnpeggedFlag ?
                            TextureAlignment.Normal : TextureAlignment.Upper,
                        worldPanning: true,
                        lightLevel: frontLight,
                        reverse: false,
                    });
                }
                if(heights.front.lowerTop > heights.front.lowerBottom){
                    // Lower quad on front side
                    wallQuads.push({
                        width: lineLength,
                        height: heights.front.lowerTop - heights.front.lowerBottom,
                        xOffset: front.x,
                        yOffset: front.y,
                        materialIndex: this.getMaterialIndex(front.lower, TextureSet.Walls),
                        startX: vertices[line.startVertex].x,
                        startY: -vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: -vertices[line.endVertex].y,
                        bottomHeight: heights.front.lowerBottom,
                        topHeight: heights.front.lowerTop,
                        sectorHeight: frontSector.ceilingHeight - frontSector.floorHeight,
                        alignment: TextureAlignment.Normal | (line.lowerUnpeggedFlag ?
                            TextureAlignment.LowerUnpegged : 0) | TextureAlignment.TwoSided,
                        worldPanning: true,
                        lightLevel: frontLight,
                        reverse: false,
                    });
                }
                if(heights.back.upperTop > heights.back.upperBottom){
                    // Upper quad on back side
                    wallQuads.push({
                        width: lineLength,
                        height: heights.back.upperTop - heights.back.upperBottom,
                        xOffset: back.x,
                        yOffset: back.y,
                        materialIndex: this.getMaterialIndex(back.upper, TextureSet.Walls),
                        /*
                        startX: vertices[line.startVertex].x,
                        startY: -vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: -vertices[line.endVertex].y,
                        */
                        startX: vertices[line.endVertex].x,
                        startY: -vertices[line.endVertex].y,
                        endX: vertices[line.startVertex].x,
                        endY: -vertices[line.startVertex].y,
                        bottomHeight: heights.back.upperBottom,
                        topHeight: heights.back.upperTop,
                        sectorHeight: backSector.ceilingHeight - backSector.floorHeight,
                        alignment: line.upperUnpeggedFlag ?
                            TextureAlignment.Normal : TextureAlignment.Upper,
                        worldPanning: true,
                        lightLevel: backLight,
                        reverse: false,
                    });
                }
                if(heights.back.lowerTop > heights.back.lowerBottom){
                    // Lower quad on back side
                    wallQuads.push({
                        width: lineLength,
                        height: heights.back.lowerTop - heights.back.lowerBottom,
                        xOffset: back.x,
                        yOffset: back.y,
                        materialIndex: this.getMaterialIndex(back.lower, TextureSet.Walls),
                        /*
                        startX: vertices[line.startVertex].x,
                        startY: -vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: -vertices[line.endVertex].y,
                        */
                        startX: vertices[line.endVertex].x,
                        startY: -vertices[line.endVertex].y,
                        endX: vertices[line.startVertex].x,
                        endY: -vertices[line.startVertex].y,
                        bottomHeight: heights.back.lowerBottom,
                        topHeight: heights.back.lowerTop,
                        sectorHeight: backSector.ceilingHeight - backSector.floorHeight,
                        alignment: TextureAlignment.Normal | (line.lowerUnpeggedFlag ?
                            TextureAlignment.LowerUnpegged : 0) | TextureAlignment.TwoSided,
                        worldPanning: true,
                        lightLevel: backLight,
                        reverse: false,
                    });
                }
            }
        }
        let totalSectorTriangleCount = 0;
        // Sector triangles - used for rendering sectors
        const sectorTriangles: SectorTriangle[] = [];
        for(const sector in sectorLines){
            const badSectors = [28].map((badSector) => badSector.toString(10)); // Doom E1M1
            // Determine whether this sector is one of the "bad" ones (Debugging)
            const sectorIsBad = badSectors.includes(sector);
            const sectorRawPolygons = this.getPolygonsFromLines(sectorLines[sector], sectorIsBad ? sector : undefined);
            const sectorPolygons: SectorPolygon[] = sectorRawPolygons.map((rawPolygon) => {
                const polygonVertexIndices = rawPolygon.map((pair) => pair[0]); // Discard second vertex index
                const polygonVertices = polygonVertexIndices.map((vertexIndex) => {
                    return new THREE.Vector2(vertices[vertexIndex].x, -vertices[vertexIndex].y);
                });
                return {
                    vertices: polygonVertices,
                    holeVertices: [],
                    boundingBox: BoundingBox.from(polygonVertices),
                    isHole: false,
                };
            });
            // Sort by area - I think this will make it faster to build the sector ceiling/floor triangles.
            sectorPolygons.sort((polyA, polyB) => polyB.boundingBox.area() - polyA.boundingBox.area());
            // Find holes
            sectorPolygons.forEach((poly, polyIndex) => {
                sectorPolygons.forEach((otherPoly, otherPolyIndex) => {
                    if(polyIndex === otherPolyIndex){
                        return;
                    }
                    const boundBoxComparison = poly.boundingBox.compare(otherPoly.boundingBox);
                    // I think another polygon can only be a hole if it is within the bounding box of another polygon
                    if(boundBoxComparison === BoundingBoxComparison.Contains){
                        // Will this be too expensive?
                        const isWithinPoly = otherPoly.vertices.some((point) => {
                            return MapGeometryBuilder.pointInPolygon(point, poly.vertices);
                        });
                        if(isWithinPoly){
                            poly.holeVertices.push(otherPoly.vertices);
                            otherPoly.isHole = true;
                        }
                        /*
                        const point = otherPoly.vertices[0];
                        if(MapGeometryBuilder.pointInPolygon(point, poly.vertices)){
                            poly.holeVertices = poly.holeVertices.concat(otherPoly.vertices);
                        }
                        */
                    }
                });
            });
            // Number.parseInt is required because for..in uses strings and not numbers
            const mapSector = this.map.sectors.getSector(Number.parseInt(sector, 10));
            const lightColor = new THREE.Color(`rgb(${mapSector.light},${mapSector.light},${mapSector.light})`);
            sectorPolygons.forEach((poly) => {
                if(poly.isHole){
                    return;
                }
                // triangulateShape expects data structures like this:
                // (contour) [{x: 10, y: 10}, {x: -10, y: 10}, {x: -10, y: -10}, {x: 10, y: -10}]
                // (holes) [[{x: 5, y: 5}, {x: -5, y: 5}, {x: -5, y: -5}, {x: 5, y: -5}], etc.]
                // console.log(`sector ${sector} vertices`, poly.vertices);
                // "as any" is necessary to compile this code, unless you've fixed your THREE.js type definitions.
                const triangles = THREE.ShapeUtils.triangulateShape(poly.vertices, poly.holeVertices as any);
                // console.log(`triangles for sector ${sector}`, triangles);
                // triangulateShape returns an array of arrays of vertex indices
                totalSectorTriangleCount += triangles.length * 2; // x2 for floor and ceiling
                const polyVertices = poly.vertices.concat(
                    poly.holeVertices.reduce((flat, arr) => flat.concat(arr), [])
                );
                triangles.forEach((triangle) => {
                    const triangleVertices = [];
                    for(const triangleVertex of triangle){
                        triangleVertices.push(polyVertices[triangleVertex]);
                    }
                    sectorTriangles.push({ // Floor
                        color: lightColor,
                        vertices: triangleVertices,
                        height: mapSector.floorHeight,
                        materialIndex: this.getMaterialIndex(mapSector.floorFlat, TextureSet.Flats),
                        normalVector: new THREE.Vector3(0, 1, 0),
                        reverse: true,
                    }, { // Ceiling
                        color: lightColor,
                        vertices: triangleVertices,
                        height: mapSector.ceilingHeight,
                        materialIndex: this.getMaterialIndex(mapSector.ceilingFlat, TextureSet.Flats),
                        normalVector: new THREE.Vector3(0, -1, 0),
                        reverse: false,
                    });
                });
            });
        }
        // Quad triangle vertex indices are laid out like this:
        // 0 ----- 1
        // |     / |
        // |   /   |
        // | /     |
        // 2 ----- 3
        const quadTriVerts = [0, 2, 1, 3, 1, 2];
        // Sort quads by material number so that it is easy to group them
        wallQuads = wallQuads.sort((a, b) => a.materialIndex - b.materialIndex);
        // Set up buffer geometry
        const bufferGeometry = new THREE.BufferGeometry();
        // 6 vertices per quad
        const verticesPerQuad = 6;
        // 3 vertices per triangle
        const verticesPerTriangle = 3;
        // 3 numbers per vertex (XYZ coordinates)
        const coordinatesPerVertex = 3;
        // 2 numbers per UV coordinate (XY coordinates)
        const coordinatesPerUV = 2;
        // 3 numbers per color (RGB channel values)
        const componentsPerColor = 3;
        // Set up buffers and attributes
        const vertexBuffer = new Float32Array(
            totalSectorTriangleCount * verticesPerTriangle * coordinatesPerVertex +
            wallQuads.length * verticesPerQuad * coordinatesPerVertex);
        const vertexAttribute = new THREE.BufferAttribute(vertexBuffer, 3);
        const normalBuffer = new Float32Array(
            totalSectorTriangleCount * verticesPerTriangle * coordinatesPerVertex +
            wallQuads.length * verticesPerQuad * coordinatesPerVertex);
        const normalAttribute = new THREE.BufferAttribute(normalBuffer, 3);
        const uvBuffer = new Float32Array(
            totalSectorTriangleCount * verticesPerTriangle * coordinatesPerUV +
            wallQuads.length * verticesPerQuad * coordinatesPerUV);
        const uvAttribute = new THREE.BufferAttribute(uvBuffer, 2);
        const colorBuffer = new Float32Array(
            totalSectorTriangleCount * verticesPerTriangle * componentsPerColor +
            wallQuads.length * verticesPerQuad * componentsPerColor);
        const colorAttribute = new THREE.BufferAttribute(colorBuffer, 3);
        // Create mesh with temporary material
        const tempMaterialColor = new THREE.Color(`hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`);
        const tempMaterial = new THREE.MeshBasicMaterial({color: tempMaterialColor.getHex(), wireframe: true});
        const mesh = new THREE.Mesh(bufferGeometry, tempMaterial);
        // Once all of the textures for the materials have been loaded, recalculate the UV coordinates.
        Promise.all(this._materialPromises).then(() => {
            // Set up group data - used by GeometryBuffer to assign multiple materials
            let lastIndex = 0;
            let lastCount = 0;
            let lastMaterialIndex = 0;
            const groups: {
                lastIndex: number;
                lastCount: number;
                lastMaterialIndex: number;
            }[] = [];
            {
                // Sort material array so that transparent textures are rendered last
                const materialArray = this._materialArray.slice();
                this._materialArray.sort((material) => material.transparent ? -1 : 1);
                const newMaterialIndices: {[old: number]: number} = {};
                for (let mtlIndex = 0; mtlIndex < materialArray.length; mtlIndex++) {
                    newMaterialIndices[mtlIndex] = this._materialArray.findIndex(
                        (v) => v === materialArray[mtlIndex]);
                }
                // Assign new material indices to sector triangles
                for(let triIndex = 0; triIndex < sectorTriangles.length; triIndex++){
                    const oldMaterialIndex = sectorTriangles[triIndex].materialIndex;
                    sectorTriangles[triIndex].materialIndex = newMaterialIndices[oldMaterialIndex];
                }
                // Assign new material indices to quads
                for(let quadIndex = 0; quadIndex < wallQuads.length; quadIndex++){
                    const oldMaterialIndex = wallQuads[quadIndex].materialIndex;
                    wallQuads[quadIndex].materialIndex = newMaterialIndices[oldMaterialIndex];
                }
            }
            // Assign UV coordinates to sectors
            for(let triIndex = 0; triIndex < totalSectorTriangleCount; triIndex++){
                const triangle = sectorTriangles[triIndex];
                if(triangle.materialIndex !== lastMaterialIndex){
                    groups.push({lastIndex, lastCount, lastMaterialIndex});
                    lastIndex += lastCount;
                    lastCount = 0;
                    lastMaterialIndex = triangle.materialIndex;
                }
                for (let vertexIndex = 0; vertexIndex < triangle.vertices.length; vertexIndex++) {
                    const fixedVertexIndex = triangle.reverse ? triangle.vertices.length - vertexIndex - 1 : vertexIndex;
                    const vertex = triangle.vertices[fixedVertexIndex];
                    const texture = this._materialArray[triangle.materialIndex].map;
                    const bufferOffset = (triIndex * verticesPerTriangle * coordinatesPerUV +
                        vertexIndex * coordinatesPerUV);
                    if(texture != null){
                        uvBuffer.set(this.getSectorVertexUVs(vertex, texture.image), bufferOffset);
                    }
                }
                lastCount += verticesPerTriangle;
            }
            // Assign UV coordinates to quads
            for(let quadIndex = 0; quadIndex < wallQuads.length; quadIndex++){
                const quad = wallQuads[quadIndex];
                if(quad.materialIndex !== lastMaterialIndex){
                    // Add another group, since the material index changed
                    groups.push({lastIndex, lastCount, lastMaterialIndex});
                    lastIndex += lastCount;
                    lastCount = 0;
                    lastMaterialIndex = quad.materialIndex;
                }
                // Calculate/assign UV coordinates for quads
                for(let vertexIterIndex = 0; vertexIterIndex < quadTriVerts.length; vertexIterIndex++) {
                    const fixedVertexIterIndex = quad.reverse ? quadTriVerts.length - vertexIterIndex - 1 : vertexIterIndex;
                    const vertexIndex = quadTriVerts[fixedVertexIterIndex];
                    const texture = this._materialArray[quad.materialIndex].map;
                    const bufferOffset = (totalSectorTriangleCount * verticesPerTriangle * coordinatesPerUV +
                        quadIndex * verticesPerQuad * coordinatesPerUV + vertexIterIndex * coordinatesPerUV);
                    if(texture != null){
                        uvBuffer.set(this.getQuadUVs(texture.image, vertexIndex, quad), bufferOffset);
                    }
                }
                lastCount += verticesPerQuad;
            }
            // Add the last group
            groups.push({lastIndex, lastCount, lastMaterialIndex});
            /*
            if(this._materialArray.length !== groups.length){
                console.warn("Different numbers of materials and groups! The map will not be textured.");
            }
            if(lastIndex + lastCount !== totalSectorTriangleCount * verticesPerTriangle + wallQuads.length * verticesPerQuad){
                console.warn("lastCount does not cover the whole mesh! The map will not be textured.");
            }
            */
            for(const group of groups){
                bufferGeometry.addGroup(group.lastIndex, group.lastCount, group.lastMaterialIndex);
            }
            // Trigger UV update
            uvAttribute.needsUpdate = true;
            // Assign actual materials
            mesh.material = this._materialArray;
            console.log("Done assigning materials to the mesh.");
            if(callback){
                callback(mesh);
            }
        }).catch((reason: any) => {
            console.error("Could not assign materials to the mesh!", reason);
            if(callback){
                callback(mesh);
            }
        });
        // Add sector polygon positions, normals, and colors to buffers
        for(let triIndex = 0; triIndex < totalSectorTriangleCount; triIndex++){
            let bufferOffset: number;
            const triangle = sectorTriangles[triIndex];
            const height = triangle.height;
            const light = triangle.color;
            for(let vertexIndex = 0; vertexIndex < triangle.vertices.length; vertexIndex++){
                const actualVertexIndex = triangle.reverse ? triangle.vertices.length - vertexIndex - 1 : vertexIndex;
                const vertex = triangle.vertices[actualVertexIndex];
                const normal = triangle.normalVector;
                bufferOffset = triIndex * verticesPerTriangle * coordinatesPerVertex + vertexIndex * coordinatesPerVertex;
                vertexBuffer.set([
                    vertex.x, height, vertex.y,
                ], bufferOffset);
                normalBuffer.set([
                    normal.x, normal.y, normal.z,
                ], bufferOffset);
                colorBuffer.set([
                    light.r, light.g, light.b,
                ], bufferOffset);
            }
        }
        // Add quad positions, normals, and colors to buffers
        for(let quadIndex = 0; quadIndex < wallQuads.length; quadIndex++){
            let bufferOffset = (totalSectorTriangleCount * verticesPerTriangle * coordinatesPerVertex +
                quadIndex * verticesPerQuad * coordinatesPerVertex);
            const quad = wallQuads[quadIndex];
            if(!quad.reverse){
                vertexBuffer.set([
                    quad.startX, quad.topHeight, quad.startY, // Upper left
                    quad.startX, quad.bottomHeight, quad.startY, // Lower left
                    quad.endX, quad.topHeight, quad.endY, // Upper right
                    quad.endX, quad.bottomHeight, quad.endY, // Lower right
                    quad.endX, quad.topHeight, quad.endY, // Upper right
                    quad.startX, quad.bottomHeight, quad.startY, // Lower left
                ], bufferOffset);
            }else{
                vertexBuffer.set([
                    quad.startX, quad.bottomHeight, quad.startY, // Lower left
                    quad.endX, quad.topHeight, quad.endY, // Upper right
                    quad.endX, quad.bottomHeight, quad.endY, // Lower right
                    quad.endX, quad.topHeight, quad.endY, // Upper right
                    quad.startX, quad.bottomHeight, quad.startY, // Lower left
                    quad.startX, quad.topHeight, quad.startY, // Upper left
                ], bufferOffset);
            }
            const normal = new THREE.Vector2(quad.startX, quad.startY);
            normal.sub(new THREE.Vector2(quad.endX, quad.endY));
            normal.normalize();
            normal.rotateAround(new THREE.Vector2(0, 0), -90 / (180 / Math.PI));
            bufferOffset = (totalSectorTriangleCount * verticesPerTriangle * coordinatesPerVertex +
                quadIndex * verticesPerQuad * coordinatesPerVertex);
            normalBuffer.set([
                normal.x, 0, normal.y, // Upper left
                normal.x, 0, normal.y, // Upper right
                normal.x, 0, normal.y, // Lower left
                normal.x, 0, normal.y, // Lower right
                normal.x, 0, normal.y, // Lower left
                normal.x, 0, normal.y, // Upper right
            ], bufferOffset);
            bufferOffset = (totalSectorTriangleCount * verticesPerTriangle * componentsPerColor +
                quadIndex * verticesPerQuad * componentsPerColor);
            colorBuffer.set([
                quad.lightLevel.r, quad.lightLevel.g, quad.lightLevel.b, // Upper left
                quad.lightLevel.r, quad.lightLevel.g, quad.lightLevel.b, // Upper right
                quad.lightLevel.r, quad.lightLevel.g, quad.lightLevel.b, // Lower left
                quad.lightLevel.r, quad.lightLevel.g, quad.lightLevel.b, // Lower right
                quad.lightLevel.r, quad.lightLevel.g, quad.lightLevel.b, // Lower left
                quad.lightLevel.r, quad.lightLevel.g, quad.lightLevel.b, // Upper right
            ], bufferOffset);
        }
        // Create buffer geometry and assign attributes
        bufferGeometry.addAttribute("position", vertexAttribute);
        bufferGeometry.addAttribute("normal", normalAttribute);
        bufferGeometry.addAttribute("uv", uvAttribute);
        bufferGeometry.addAttribute("color", colorAttribute);
        console.log("Done building the mesh.");
        return mesh;
    }
}
