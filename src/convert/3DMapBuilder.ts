import * as THREE from "three";

import {WADMap} from "@src/lumps/doom/map";
import {WADMapLine} from "@src/lumps/doom/mapLines";
import {WADMapSector} from "@src/lumps/doom/mapSectors";
import {WADMapVertex} from "@src/lumps/doom/mapVertexes";
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

// 2D Vertex position and index
interface SectorVertex {
    position: THREE.Vector2;
    index: number;
}

class SectorPolygonBuilder {
    // Takes lines of a sector, and converts it to polygons
    // The "edges" of a sector, and whether or not they have been added
    private edgesLeft: {[edge: string]: boolean};
    // The "edges" (start/end vertex of each line, as number arrays)
    private readonly sectorEdges: number[][];
    // Vertices used by the sector's lines
    private readonly mapVertices: WADMapVertex[];

    constructor(sectorLines: WADMapLine[], mapVertices: WADMapVertex[]){
        // Get sector edges
        this.sectorEdges = [];
        this.edgesLeft = {};
        for(const line of sectorLines){
            this.sectorEdges.push([line.startVertex, line.endVertex]);
            this.edgesLeft[`${line.startVertex} ${line.endVertex}`] = false;
        }
        // Sector to map indices
        const sectorVertexIndices: number[] = [];
        for(const edge of this.sectorEdges){
            for(const edgeVertex of edge){
                if(!sectorVertexIndices.includes(edgeVertex)){
                    sectorVertexIndices.push(edgeVertex);
                }
            }
        }
        // Sector vertices
        this.mapVertices = mapVertices;
    }

    // Get the clockwise or counterclockwise angle between three points
    public static angleBetween(p1: THREE.Vector2, center: THREE.Vector2,
            p2: THREE.Vector2, clockwise: boolean = false): number {
        // Rewritten to be simpler and work better with the THREE.js API
        const ab = p1.clone().sub(center).normalize();
        const cb = p2.clone().sub(center).normalize();
        // Dot and cross product of the two vectors
        const dot = ab.dot(cb);
        const cross = ab.cross(cb);
        // Angle - will always be positive
        return Math.atan2(clockwise ? cross : -cross, -dot) + Math.PI;
    }

    // Get sector vertex info (map index)
    protected vertexFor(vertexIndex: number): SectorVertex {
        const {x, y} = this.mapVertices[vertexIndex];
        return {
            index: vertexIndex,
            position: new THREE.Vector2(x, y),
        };
    }

    protected findNextStartEdge(clockwise: boolean = false): number[] {
        // Filter out vertices to skip
        const usableEdges = this.sectorEdges.filter((edge) => {
            // Ensure I pick an edge which has not been added.
            return this.edgesLeft[edge.join(" ")] === false;
        });
        // Find rightmost vertex
        const usableVertices: number[] = usableEdges.reduce<number[]>((vertices, edge) => {
            return vertices.concat(edge.filter((edgeVertex) => !vertices.includes(edgeVertex)));
        }, usableEdges[0]);
        const rightMostVertex: SectorVertex = usableVertices.reduce<SectorVertex>((rightMostVertex, currentIndex) => {
            const currentVertex = this.vertexFor(currentIndex);
            if(currentVertex.position.x > rightMostVertex.position.x){
                return currentVertex;
            }
            return rightMostVertex;
        }, this.vertexFor(usableVertices[0]));
        // Find edges connected to the rightmost vertex
        const rightMostEdges = this.sectorEdges.filter((edge) => {
            if(edge.includes(rightMostVertex.index)){
                // Ensure no used edges are picked
                return this.edgesLeft[edge.join(" ")] === false;
            }
            return false;
        })!;
        // Get vertices connected to the rightmost vertex
        const rightMostConnectedVertices: SectorVertex[] = rightMostEdges.map(
            (edge) => edge[0] === rightMostVertex.index ? edge[1] : edge[0]
        ).map<SectorVertex>((vertexIndex) => this.vertexFor(vertexIndex));
        // Sort vertices in clockwise order
        // First, get center point
        const vertexCount = rightMostConnectedVertices.length;
        const centerPoint = new THREE.Vector2(0, 0);
        rightMostConnectedVertices.forEach((sectorVertex) => {
            centerPoint.add(sectorVertex.position);
        });
        centerPoint.divideScalar(vertexCount);
        // Find angles between the rightmost vertex, the center, and each
        // connected vertex.
        const angles = rightMostConnectedVertices.map((vertex) => {
            const rightMostVector = rightMostVertex.position;
            const vertexVector = vertex.position;
            return SectorPolygonBuilder.angleBetween(
                rightMostVector, centerPoint, vertexVector, clockwise);
        });
        // Find the point with the lowest angle
        const lowestAngle = Math.min.apply(null, angles);
        const lowestAngleIndex = angles.findIndex((angle) => angle === lowestAngle)!;
        return [rightMostVertex.index, rightMostConnectedVertices[lowestAngleIndex].index];
    }

    protected findNextVertex(
        from: number,
        previous: number,
        clockwise: boolean = false
    ): number | null {
        // Find all edges that:
        // - Have not been added to a polygon
        // - Are attached to the "from" vertex
        // - Are not the "previous" vertex
        const edges: number[][] = this.sectorEdges.filter((edge) => {
            if(this.edgesLeft[edge.join(" ")] === true){
                return false;
            }
            if(edge.includes(from) && !edge.includes(previous)){
                return true;
            }
            return false;
        });
        if(edges.length > 1){
            // Find the vertices that are attached to the edge
            const intersectionVertices: number[] = edges.map((edge) => {
                return edge.find((edgeVertex) => {
                    return edgeVertex !== from &&
                        edgeVertex !== previous;
                }) || null;
            }).filter<number>(
                (vertex): vertex is number => vertex != null
            );
            // Find the vertex that is connected by the lowest angle
            let mostAcuteAngle = Math.PI * 2;
            let mostAcuteVertex = 0;
            const startVector = this.vertexFor(previous).position;
            const midVector = this.vertexFor(from).position;
            // Iterate through vertices, find which one has the lowest angle
            for(const vertexIndex of intersectionVertices){
                const endVector = this.vertexFor(vertexIndex).position;
                const angle = SectorPolygonBuilder.angleBetween(
                        endVector, midVector, startVector, clockwise);
                if(angle < mostAcuteAngle){
                    mostAcuteAngle = angle;
                    mostAcuteVertex = vertexIndex;
                }
            }
            return mostAcuteVertex;
        }else if(edges.length === 1){
            // There should be at least 1 vertex that comes next in the polygon
            const otherVertex = edges[0].find((edgeVertex) => {
                return edgeVertex !== from;
            });
            // otherVertex could be 0, and 0 || null === null.
            if(otherVertex === undefined){
                return null;
            }
            return otherVertex;
        }else{
            return null;
        }
    }

    // Marks the given edge as being added to a polygon
    protected visitEdge(
        edgeStart: number, edgeEnd: number, recursive: boolean = false
    ): boolean {
        const edgeKey = `${edgeStart} ${edgeEnd}`;
        if(this.edgesLeft.hasOwnProperty(edgeKey)){
            this.edgesLeft[edgeKey] = true;
            return true;
        }
        if(recursive){
            // No edge found despite reversing arguments
            return false;
        }
        // Recursively call this function with reversed arguments
        return this.visitEdge(edgeEnd, edgeStart, true);
    }

    protected isPolygonComplete(polygon: number[]): boolean {
        if(polygon.length < 3){
            // There is no such thing as a 2 sided polygon
            return false;
        }
        const first = polygon[0];
        const last = polygon[polygon.length - 1];
        // Get edges containing first vertex.
        const firstEdges = this.sectorEdges.filter(
            (edge) => edge.includes(first));
        // Get edge containing both first vertex and last vertex.
        const lastEdges = firstEdges.filter((edge) => edge.includes(last));
        // If an edge is found, lastEdges will have at least one edge in it.
        return lastEdges.length !== 0;
    }

    // Get the polygons that make up the sector, as indices in the VERTEXES lump
    getPolygons(): number[][] {
        // Make a new array with the sector polygons
        const startEdge = this.findNextStartEdge();
        // Current polygon index
        let curPolygon = 0;
        // Polygon array
        // e.g. [[0, 1, 2, 3], [4, 5, 6, 7]]
        const sectorPolygons: number[][] = [startEdge];
        // Mark start edge as visited.
        this.visitEdge(startEdge[0], startEdge[1]);
        for(let vertexIteration = 2; // Start with 2 vertices in the polygon
            vertexIteration < this.sectorEdges.length; vertexIteration++
        ){
            // The vertex from which to start the search for the next vertex
            const [prevVertex, lastVertex] = sectorPolygons[curPolygon].slice(-2);
            this.visitEdge(prevVertex, lastVertex);
            // The next vertex to add to the polygon
            const nextVertex = this.findNextVertex(lastVertex, prevVertex);
            // nextVertex is null - no more vertices left in this polygon
            if(nextVertex == null ||
                    this.isPolygonComplete(sectorPolygons[curPolygon])){
                if(!this.visitEdge(lastVertex, sectorPolygons[curPolygon][0])){
                    // Last polygon is a dud
                    sectorPolygons.pop();
                }
                // Add another polygon
                curPolygon += 1;
                // Find the first edge of the next polygon, and add it to the
                // polygons that make up this sector
                const nextStartEdge = this.findNextStartEdge();
                sectorPolygons.push(nextStartEdge);
                // "Visit" each vertex of the starting edge
                this.visitEdge(nextStartEdge[0], nextStartEdge[1]);
                // A new polygon was added, and vertexIteration was already
                // incremented by the for loop, so 1 should be added, since an
                // edge contains two vertices
                vertexIteration += 1;
            }else{
                // There is another vertex in the polygon
                this.visitEdge(lastVertex, nextVertex);
                sectorPolygons[curPolygon].push(nextVertex);
            }
        }
        return sectorPolygons;
    }
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

// Anything that uses a named texture
interface DoomTextured {
    // The name of the texture
    texture: string;
    // The preferred texture set
    textureSet: TextureSet;
}

// Mappable thing - image or quad
export interface Mappable {
    // The width of the quad/texture in map units
    width: number;
    // The height of the quad/texture in map units
    // For quads, negative values will force the height to be re-calculated
    // based on the texture's height
    height: number;
    // The X scale of the quad or texture.
    xScale?: number;
    // The Y scale of the quad or texture.
    yScale?: number;
}

// Different alignment types for textures on a line quad
export enum TextureAlignmentType {
    // Middle texture for one-sided walls, or upper or lower texture for two-sided walls
    Normal,
    // Upper texture that is not unpegged
    Upper,
    // Midtexture quad
    Midtexture,
    // Back-side midtexture quad
    BackMidtexture,
}

// Different settings that apply to line quad texture alignment
export enum TextureAlignmentFlags {
    Normal = 0,
    World = 1, // Doom 64
    LowerUnpegged = 2, // Lower Unpegged Flag
    TwoSided = 4, // Two-Sided Flag
}

// 
export interface TextureAlignment {
    type: TextureAlignmentType;
    flags: TextureAlignmentFlags;
}

// Generic 4-sided polygon
interface Quad extends Mappable, DoomTextured {}

interface DoomLighting {
    // Sector light level
    lightLevel: number;
}

interface DoomPSXLighting {
    // Color of floors and ceilings in Doom 64, only applies to walls for Doom PSX
    color: THREE.Color;
}

interface Doom64WallLighting {
    // Vertex color at the top of the wall
    topColor: THREE.Color;
    // Vertex color at the bottom of the wall
    bottomColor: THREE.Color;
}

interface GZDoomWallLighting extends DoomLighting, Doom64WallLighting {}

// Whether a line quad is an upper, middle, lower, or 3D floor line quad.
// Currently used to help connect the vertices in an OBJ.
export enum LineQuadPlace {
    // Upper quad
    Upper,
    // One-sided line quad
    Middle,
    // Midtexture quad
    Midtexture,
    // Lower quad
    Lower,
    // 3D floor quad (same as middle, but with floor and ceiling swapped)
    ThreeDeeFloor,
}

// A quad on a line or side
export interface LineQuad extends Quad, DoomLighting {
    // A mini-interface specifying how the texture on this quad should be
    // aligned. The "type" field stores an enum value containing the alignment 
    // type, and the "flags" field stores flags, such as whether the quad is
    // "lower unpegged" or two-sided
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
    // Absolute Z height of the top of the quad
    topHeight: number;
    // Absolute Z height for the ceiling of the sector that this quad's side
    // belongs to. Useful for calculating the quad height for midtextures
    ceilingHeight: number;
    // Absolute Z height for the floor of the sector that this quad's side
    // belongs to
    floorHeight: number;
    // Whether scaled texture offsets are applied in world space or texel space
    worldPanning: boolean;
    // The X offset of the texture on the quad
    xOffset: number;
    // The Y offset of the texture on the quad
    yOffset: number;
    // Whether or not to reverse the order of the vertices so as to make the face point in the right direction
    reverse: boolean;
    // Where the line quad is with regards to
    place: LineQuadPlace;
}

// Whether a sector triangle is on the floor or ceiling
export enum SectorTrianglePlace {
    // Triangle is on the floor
    Floor,
    // Triangle is on the ceiling
    Ceiling,
    // The top of a 3D floor is a floor, and the bottom is a ceiling
}

export interface SectorTriangle extends DoomTextured, DoomLighting {
    // Vertices that make this triangle
    vertices: THREE.Vector2[];
    // Absolute height
    height: number;
    // The triangle normal vector
    normalVector: THREE.Vector3;
    // Whether the triangle's vertices should be reversed so as to point inwards
    reverse: boolean;
    // Whether the triangle is on the floor or ceiling
    place: SectorTrianglePlace;
}

export interface MapGeometry {
    // Array of quads for each line
    wallQuads: LineQuad[];
    // Array of triangles for each sector
    sectorTriangles: SectorTriangle[];
}

export enum QuadVertexPosition {
    UpperLeft,
    UpperRight,
    LowerLeft,
    LowerRight,
}

// This class takes map data, and creates a 3D mesh from it.
export class MapGeometryBuilder {
    // The map data
    protected map: WADMap;
    protected vertices: WADMapVertex[];
    /*
    // The texture library
    protected textureLibrary: TextureLibrary | null;
    // Texture for walls and flats with missing textures.
    protected _materials: {[name: string]: number};
    protected _materialArray: THREE.MeshBasicMaterial[];
    protected _materialPromises: Promise<TransparentTexture>[];
    protected _disposables: Disposable[];
    */

    constructor(map: WADMap){
        this.map = map;
        this.vertices = [];
        /*
        this._materials = {};
        this._materialArray = [];
        this._materialPromises = [];
        this._disposables = [];
        */
    }

    // Point-in-polygon algorithm - used to find out whether a contiguous set
    // of vertices is a hole in a sector polygon
    public static pointInPolygon(point: THREE.Vector2, polygon: THREE.Vector2[]): boolean {
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
        // Code from https://github.com/substack/point-in-polygon/blob/96ef4abc2a623c98214618418e42a68240055f2e/index.js
        // Licensed under MIT license
        // (c) 2011 James Halliday
        const x = point.x, y = point.y;
        let inside = false;
        for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
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

    // Recalculates quad heights, given a quad and a texture.
    // Modifies the quad's height, topHeight, and its yOffset.
    // Does nothing to middle, upper, or lower quads.
    // Returns the modified quad.
    public static recalculateMidtex(quad: LineQuad, texture: Mappable): LineQuad {
        // Midtexture height must be calculated.
        // The bottom of Midtextures on lower unpegged linedefs are at the
        // floor of the shortest sector,  offsetted by the Y offset
        // If the midtexture is on a lower unpegged linedef, wall.topHeight is
        // treated as the absolute height of the bottom of the wall rather than
        // the absolute height of the top of the wall.
        if((quad.alignment.type === TextureAlignmentType.Midtexture) ||
            (quad.alignment.type === TextureAlignmentType.BackMidtexture)
        ){
            const startHeight = ((
                quad.alignment.flags &
                TextureAlignmentFlags.LowerUnpegged) !== 0 ?
                quad.floorHeight + texture.height :
                quad.ceilingHeight);
            quad.topHeight = startHeight + quad.yOffset;
            quad.height = texture.height;
            // Difference between quad top height and ceiling height
            const ceilingDifference = quad.ceilingHeight - quad.topHeight;
            if(ceilingDifference < 0){
                // Quad top is above the ceiling
                quad.height += ceilingDifference;
                quad.topHeight = quad.ceilingHeight;
                // Y offset will be positive, ceilingDifference is negative
                quad.yOffset = -ceilingDifference;
            }else{
                // No need to apply Y offset
                quad.yOffset = 0;
            }
            // Difference between floor height and quad bottom height
            const floorDifference = quad.floorHeight - (quad.topHeight - quad.height);
            if(floorDifference > 0){
                // Quad bottom is beneath the floor
                quad.height -= floorDifference;
            }
            // Just in case quad is completely below the floor
            if(quad.height < 0){
                quad.height = 0;
            }
        }
        return quad;
    }

    // Get UV coordinates for a quad
    public static getQuadUVs(
            texture: Mappable, // UV coordinates depend on texture size
            vertexIndex: QuadVertexPosition, // Index of vertex in quad
            quad: LineQuad // The data representing the quad
        ){
        // Separate quad.alignment into type and flags
        const alignType = quad.alignment.type;
        const alignFlags = quad.alignment.flags;
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
        if(alignType === TextureAlignmentType.BackMidtexture){
            uvX *= 1 - uvFactorX[vertexIndex];
        }else{
            uvX *= uvFactorX[vertexIndex];
        }
        uvX += quad.xOffset * texelX;
        if((alignType !== TextureAlignmentType.Midtexture) &&
            (alignType !== TextureAlignmentType.BackMidtexture)){
            // Quad is NOT a midtexture
            if((alignFlags & TextureAlignmentFlags.LowerUnpegged) !== 0){
                // Quad is lower unpegged
                if((alignFlags & TextureAlignmentFlags.TwoSided) === 0){
                    // One-sided - bottom of texture is at bottom of quad
                    uvY += 1 - texelY * quad.height;
                }else{
                    // Two-sided - top of texture is at top of sector
                    // uvY += (quad.sectorHeight - quad.height) * texelY;
                    const sectorHeight = quad.ceilingHeight - quad.floorHeight;
                    uvY += (sectorHeight - quad.height) * texelY;
                }
            }else if(alignType === TextureAlignmentType.Upper){
                uvY += 1 - quad.height * texelY;
            }
        }
        // Apply Y offset regardless.
        // The Y offset for midtextures is modified by recalculateMidtex, since
        // Y offsets for midtextures won't modify the UV coordinates if the
        // midtexture in question is shorter than the sector.
        uvY += quad.yOffset * texelY;
        return [uvX, uvY];
    }

    // Get UV coordinates for a sector vertex
    public static getSectorVertexUVs(
        position: THREE.Vector2, // 2D position of the vertex
        texture: Mappable, // UV coordinates depend on texture size
    ){
        const uvX = position.x / texture.width;
        const uvY = position.y / texture.height;
        return [uvX, uvY];
    }

    /*
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
            const rgba = this.textureLibrary!.getRgba(texName, set);
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
            if(!this.textureLibrary){
                rej("Texture library unavailable");
                return;
            }
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
    */

    // Turn a list of sector lines into a list of vertex indices
    protected getPolygonsFromLines(sectorLines: WADMapLine[],
            sector?: string): number[][] {
        const sectorPolygonBuilder = new SectorPolygonBuilder(
            sectorLines, this.vertices,
        );
        const sectorPolygons  = sectorPolygonBuilder.getPolygons();
        if(sector){ // Debug stuff
            console.log(`sectorPolygons for sector ${sector}`, sectorPolygons);
            let sectorPolygonsCombined: number[][] = [];
            sectorPolygons.forEach((poly) =>
                sectorPolygonsCombined = sectorPolygonsCombined.concat(poly));
        }
        return sectorPolygons;
    }

    // Get quads for a particular line
    protected getQuadsForLine(line: WADMapLine): LineQuad[] {
        // Ensure line has a valid front sidedef
        if(line.frontSidedef === 0xffff){
            return [];
        }
        // All lines are made of 1-3 quads - A top quad, and/or bottom quad,
        // and an optional middle quad for two-sided lines, and a middle quad
        // for one-sided lines.
        const front = this.map.sides!.getSide(line.frontSidedef);
        const frontSector = this.map.sectors!.getSector(front.sector);
        const frontLight = frontSector.light;
        let back = null;
        // Calculate line length - the "width" of quad(s) for the line.
        const lineLength: number = (() => {
            const lineX = this.vertices[line.endVertex].x - this.vertices[line.startVertex].x;
            const lineY = this.vertices[line.endVertex].y - this.vertices[line.startVertex].y;
            return Math.sqrt(lineX * lineX + lineY * lineY);
        })();
        const frontHeight = frontSector.ceilingHeight - frontSector.floorHeight;
        if(!line.twoSidedFlag){
            // No back side
            // The line is the same height as the sector
            const alignment = {
                type: TextureAlignmentType.Normal,
                flags: line.lowerUnpeggedFlag ?
                    TextureAlignmentFlags.LowerUnpegged :
                    TextureAlignmentFlags.Normal,
            };
            return[{
                width: lineLength,
                height: frontHeight,
                xOffset: front.x,
                yOffset: front.y,
                texture: front.middle,
                textureSet: TextureSet.Walls,
                startX: this.vertices[line.startVertex].x,
                startY: -this.vertices[line.startVertex].y,
                endX: this.vertices[line.endVertex].x,
                endY: -this.vertices[line.endVertex].y,
                topHeight: frontSector.ceilingHeight,
                ceilingHeight: frontSector.ceilingHeight,
                floorHeight: frontSector.floorHeight,
                alignment,
                worldPanning: true,
                lightLevel: frontLight,
                reverse: false,
                place: LineQuadPlace.Middle,
            }];
        }else{
            // This line is a two-sided line. In other words, it has a sector
            // on both sides.
            if(line.backSidedef === 0xffff){
                // A two-sided line without a back sidedef shouldn't exist.
                return [];
            }
            // A 2-sided line may have up to 3 quads - top, middle, and bottom.
            const lineQuads: LineQuad[] = [];
            // It is known that the side will not be null because the sidedef
            // index is not 0xffff
            back = this.map.sides!.getSide(line.backSidedef);
            const backSector = this.map.sectors!.getSector(back.sector);
            const backHeight = backSector.ceilingHeight - backSector.floorHeight;
            const backLight = backSector.light;
            const heights = getSideHeights(frontSector, backSector);
            if(heights.middleTop - heights.middleBottom > 0){
                if(front.middle !== "-"){
                    // Front side midtex
                    let midQuadTop = line.lowerUnpeggedFlag ?
                        heights.middleBottom : heights.middleTop;
                    midQuadTop += front.y;
                    const alignment = {
                        type: TextureAlignmentType.Midtexture,
                        flags: line.lowerUnpeggedFlag ? TextureAlignmentFlags.LowerUnpegged : 0,
                    };
                    lineQuads.push({
                        width: lineLength,
                        height: -1, // Calculate height based on texture height
                        xOffset: front.x,
                        yOffset: front.y,
                        texture: front.middle,
                        textureSet: TextureSet.Walls,
                        startX: this.vertices[line.startVertex].x,
                        startY: -this.vertices[line.startVertex].y,
                        endX: this.vertices[line.endVertex].x,
                        endY: -this.vertices[line.endVertex].y,
                        topHeight: midQuadTop,
                        ceilingHeight: heights.middleTop,
                        floorHeight: heights.middleBottom,
                        alignment,
                        worldPanning: true,
                        lightLevel: frontLight,
                        reverse: false,
                        place: LineQuadPlace.Midtexture,
                    });
                }
                if(back.middle !== "-"){
                    // Back side midtex
                    let midQuadTop = line.lowerUnpeggedFlag ?
                        heights.middleBottom : heights.middleTop;
                    midQuadTop += back.y;
                    const alignment = {
                        type: TextureAlignmentType.BackMidtexture,
                        flags: line.lowerUnpeggedFlag ? TextureAlignmentFlags.LowerUnpegged : 0,
                    };
                    lineQuads.push({
                        width: lineLength,
                        height: -1,
                        xOffset: back.x,
                        yOffset: back.y,
                        texture: back.middle,
                        textureSet: TextureSet.Walls,
                        startX: this.vertices[line.startVertex].x,
                        startY: -this.vertices[line.startVertex].y,
                        endX: this.vertices[line.endVertex].x,
                        endY: -this.vertices[line.endVertex].y,
                        topHeight: midQuadTop,
                        ceilingHeight: heights.middleTop,
                        floorHeight: heights.middleBottom,
                        alignment,
                        worldPanning: true,
                        lightLevel: backLight,
                        reverse: true,
                        place: LineQuadPlace.Midtexture,
                    });
                }
            }
            if(heights.front.upperTop > heights.front.upperBottom){
                // Upper quad on front side
                const alignment = {
                    // Normal alignment is equivalent to upper unpegged
                    type: line.upperUnpeggedFlag ?
                        TextureAlignmentType.Normal :
                        TextureAlignmentType.Upper,
                    flags: 0,
                };
                lineQuads.push({
                    width: lineLength,
                    height: heights.front.upperTop - heights.front.upperBottom,
                    xOffset: front.x,
                    yOffset: front.y,
                    texture: front.upper,
                    textureSet: TextureSet.Walls,
                    startX: this.vertices[line.startVertex].x,
                    startY: -this.vertices[line.startVertex].y,
                    endX: this.vertices[line.endVertex].x,
                    endY: -this.vertices[line.endVertex].y,
                    topHeight: heights.front.upperTop,
                    ceilingHeight: frontSector.ceilingHeight,
                    floorHeight: frontSector.floorHeight,
                    alignment,
                    worldPanning: true,
                    lightLevel: frontLight,
                    reverse: false,
                    place: LineQuadPlace.Upper,
                });
            }
            if(heights.front.lowerTop > heights.front.lowerBottom){
                // Lower quad on front side
                const alignment = {
                    type: TextureAlignmentType.Normal,
                    flags: TextureAlignmentFlags.TwoSided |
                        (line.lowerUnpeggedFlag ?
                        TextureAlignmentFlags.LowerUnpegged : 0),
                };
                lineQuads.push({
                    width: lineLength,
                    height: heights.front.lowerTop - heights.front.lowerBottom,
                    xOffset: front.x,
                    yOffset: front.y,
                    texture: front.lower,
                    textureSet: TextureSet.Walls,
                    startX: this.vertices[line.startVertex].x,
                    startY: -this.vertices[line.startVertex].y,
                    endX: this.vertices[line.endVertex].x,
                    endY: -this.vertices[line.endVertex].y,
                    topHeight: heights.front.lowerTop,
                    ceilingHeight: frontSector.ceilingHeight,
                    floorHeight: frontSector.floorHeight,
                    alignment,
                    worldPanning: true,
                    lightLevel: frontLight,
                    reverse: false,
                    place: LineQuadPlace.Lower,
                });
            }
            if(heights.back.upperTop > heights.back.upperBottom){
                // Upper quad on back side
                const alignment = {
                    type: line.upperUnpeggedFlag ?
                        TextureAlignmentType.Normal :
                        TextureAlignmentType.Upper,
                    flags: 0,
                };
                lineQuads.push({
                    width: lineLength,
                    height: heights.back.upperTop - heights.back.upperBottom,
                    xOffset: back.x,
                    yOffset: back.y,
                    texture: back.upper,
                    textureSet: TextureSet.Walls,
                    startX: this.vertices[line.endVertex].x,
                    startY: -this.vertices[line.endVertex].y,
                    endX: this.vertices[line.startVertex].x,
                    endY: -this.vertices[line.startVertex].y,
                    topHeight: heights.back.upperTop,
                    ceilingHeight: backSector.ceilingHeight,
                    floorHeight: backSector.floorHeight,
                    alignment,
                    worldPanning: true,
                    lightLevel: backLight,
                    reverse: false,
                    place: LineQuadPlace.Upper,
                });
            }
            if(heights.back.lowerTop > heights.back.lowerBottom){
                // Lower quad on back side
                const alignment = {
                    type: TextureAlignmentType.Normal,
                    flags: TextureAlignmentFlags.TwoSided |
                        (line.lowerUnpeggedFlag ?
                        TextureAlignmentFlags.LowerUnpegged : 0),
                };
                lineQuads.push({
                    width: lineLength,
                    height: heights.back.lowerTop - heights.back.lowerBottom,
                    xOffset: back.x,
                    yOffset: back.y,
                    texture: back.lower,
                    textureSet: TextureSet.Walls,
                    startX: this.vertices[line.endVertex].x,
                    startY: -this.vertices[line.endVertex].y,
                    endX: this.vertices[line.startVertex].x,
                    endY: -this.vertices[line.startVertex].y,
                    topHeight: heights.back.lowerTop,
                    ceilingHeight: backSector.ceilingHeight,
                    floorHeight: backSector.floorHeight,
                    alignment,
                    worldPanning: true,
                    lightLevel: backLight,
                    reverse: false,
                    place: LineQuadPlace.Lower,
                });
            }
            return lineQuads;
        }
        return [];
    }

    // Create all of the sector triangles for the map
    protected getSectorTriangles(sector: number, lines: WADMapLine[]): SectorTriangle[] {
        // if(hasGlNodes){  // GL nodes contain data useful for triangulating sectors
        // }else{
        // Get sector polygons and triangulate the sector
        const sectorRawPolygons = this.getPolygonsFromLines(lines);
        const sectorPolygons: SectorPolygon[] = sectorRawPolygons.map(
        (rawPolygon) => {
            // Convert indices to positions
            const polygonVertices = rawPolygon.map((vertexIndex) => {
                return new THREE.Vector2(
                    this.vertices[vertexIndex].x, -this.vertices[vertexIndex].y);
            });
            return {
                vertices: polygonVertices,
                holeVertices: [],
                boundingBox: BoundingBox.from(polygonVertices),
                isHole: false,
            };
        });
        // Sort by area in descending order.
        // I think this will make it faster to build the sector
        // ceiling/floor triangles.
        sectorPolygons.sort((polyA, polyB) =>
            polyB.boundingBox.area() - polyA.boundingBox.area());
        // Find holes
        sectorPolygons.forEach((polygon, polygonIndex) => {
            // Find out which polygons "contain" this one
            let containerPolygons = sectorPolygons.slice(0, polygonIndex);
            containerPolygons = containerPolygons.filter((otherPolygon) => {
                if(otherPolygon.boundingBox.area() === polygon.boundingBox.area()){
                    return false;
                }
                const boundBoxComparison = otherPolygon.boundingBox.compare(polygon.boundingBox);
                if(boundBoxComparison === BoundingBoxComparison.Contains){
                    return polygon.vertices.some((point) => {
                        return MapGeometryBuilder.pointInPolygon(point, otherPolygon.vertices);
                    });
                }
                return false;
            });
            // Get the smallest polygon containing this one, and make this
            // polygon a hole if the smallest polygon containing this one is not.
            const smallestContainerPolygon: SectorPolygon | undefined = (
                containerPolygons[containerPolygons.length - 1]);
            if(smallestContainerPolygon && !smallestContainerPolygon.isHole){
                smallestContainerPolygon.holeVertices.push(polygon.vertices);
                polygon.isHole = true;
            }
        });
        const mapSector = this.map.sectors!.getSector(sector);
        const sectorTriangles: SectorTriangle[] = [];
        sectorPolygons.forEach((poly) => {
            if(poly.isHole){
                return;
            }
            // triangulateShape expects data structures like this:
            // (contour) [{x: 10, y: 10}, {x: -10, y: 10}, {x: -10, y: -10}, {x: 10, y: -10}]
            // (holes) [[{x: 5, y: 5}, {x: -5, y: 5}, {x: -5, y: -5}, {x: 5, y: -5}], etc.]
            const triangles = THREE.ShapeUtils.triangulateShape(poly.vertices, poly.holeVertices);
            // console.log(`triangles for sector ${sector}`, triangles);
            // triangulateShape returns an array of arrays of vertex indices
            const polyVertices = poly.vertices.concat(
                poly.holeVertices.reduce((flat, arr) => flat.concat(arr), [])
            );
            triangles.forEach((triangle) => {
                const triangleVertices = [];
                for(const triangleVertex of triangle){
                    triangleVertices.push(polyVertices[triangleVertex]);
                }
                sectorTriangles.push({ // Floor
                    lightLevel: mapSector.light,
                    vertices: triangleVertices,
                    height: mapSector.floorHeight,
                    texture: mapSector.floorFlat,
                    textureSet: TextureSet.Flats,
                    normalVector: new THREE.Vector3(0, 1, 0),
                    reverse: true,
                    place: SectorTrianglePlace.Floor,
                }, { // Ceiling
                    lightLevel: mapSector.light,
                    vertices: triangleVertices,
                    height: mapSector.ceilingHeight,
                    texture: mapSector.ceilingFlat,
                    textureSet: TextureSet.Flats,
                    normalVector: new THREE.Vector3(0, -1, 0),
                    reverse: false,
                    place: SectorTrianglePlace.Ceiling,
                });
            });
        });
        return sectorTriangles;
    }

    // Build the 3D mesh for the map
    public rebuild(): MapGeometry {
        // The map is missing one of the necessary data lumps
        if(!this.map.sides || !this.map.sectors || !this.map.lines || !this.map.vertexes){
            throw new TypeError("Some map data is missing!");
        }
        // If the map has GL nodes, use them instead of trying to triangulate the sector manually.
        const hasGlNodes = false;
        // Map of sector indices to lines that form that sector
        const sectorLines: {[sector: number]: WADMapLine[]} = {};
        // Vertices
        this.vertices = Array.from(this.map.enumerateVertexes());
        // Array of quads - used for rendering walls
        const wallQuads: LineQuad[] = [];
        // Construct all of the quads for the lines on this map
        for(const line of this.map.enumerateLines()){
            for(const quad of this.getQuadsForLine(line)){
                wallQuads.push(quad);
            }
            if(line.frontSidedef !== 0xffff){  // 0xffff means no sidedef.
                const front = this.map.sides.getSide(line.frontSidedef);
                if(!line.twoSidedFlag){
                    if(sectorLines[front.sector] == null){
                        sectorLines[front.sector] = [];
                    }
                    sectorLines[front.sector].push(line);
                }else{
                    if(line.backSidedef !== 0xffff){
                        const back = this.map.sides.getSide(line.backSidedef);
                        // Line is two-sided
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
                    }
                }
            }
        }
        // Sector triangles - used for rendering sectors
        const sectorTriangles: SectorTriangle[] = [];
        for(const sector in sectorLines){
            // Number.parseInt is required because object keys are strings
            const sectorNumber = Number.parseInt(sector, 10);
            for(const triangle of this.getSectorTriangles(sectorNumber, sectorLines[sector])){
                sectorTriangles.push(triangle);
            }
        }
        return {
            wallQuads,
            sectorTriangles,
        };
    }
}
