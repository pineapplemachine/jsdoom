import * as THREE from "three";

type nil = null | undefined;

import {WADMap} from "@src/lumps/doom/map";
import {WADMapSector} from "@src/lumps/doom/mapSectors";
import {WADTexture, TextureLibrary} from "@src/lumps/doom/textures";

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

enum TextureAlignment {
    Normal,
    LowerUnpegged,
    UpperUnpegged,
    None,
    World,
}

interface Quad extends Mappable {
    // The X offset of the texture on the quad
    xOffset: number;
    // The Y offset of the texture on the quad
    yOffset: number;
    // The index of the material for this quad
    materialIndex: number;
    // If the texture on the quad is unpegged
    alignment: TextureAlignment;
    // Whether scaled texture offsets are applied in world space or texel space
    worldPanning: boolean;
}

// A quad on a line or side
interface LineQuad extends Quad {
    // X of start vertex
    startX: number;
    // Y of start vertex
    startY: number;
    // X of end vertex
    endX: number;
    // Y of end vertex
    endY: number;
    // Absolute Z height of the bottom of the quad
    bottomHeight: number;
    // Absolute Z height of the top of the quad
    topHeight: number;
    // Upper and lower vertex colors (for Doom 64 style lighting)
    upperColor?: number;
    lowerColor?: number;
}

interface TransparentTexture {
    // The texture to use
    texture: THREE.Texture;
    // Whether or not this texture is transparent
    transparent: boolean;
}

// This class takes map data, and creates a 3D mesh from it.
export class MapGeometryBuilder {
    // The map data
    protected map: WADMap;
    // The texture library
    protected textureLibrary: TextureLibrary;
    // Texture for walls and flats with missing textures. Temporary.
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
    protected getQuadUVs(
            texture: Mappable, // UV coordinates depend on texture size
            vertexIndex: number, // Index of vertex in quad
            quad: Quad // The data representing the quad
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
        let uvX = texelX * uvFactorX[vertexIndex] * quad.width * xScale;
        let uvY = texelY * uvFactorY[vertexIndex] * quad.height * yScale;
        uvX += (quad.xOffset * texelX);
        if(quad.alignment !== TextureAlignment.None){
            if(quad.alignment === TextureAlignment.LowerUnpegged){
                uvY -= quad.height * texelY;
            }
            uvY += quad.yOffset * texelY;
        }
        return [uvX, uvY];
    }
    protected optionalTexture(texName: string): Promise<TransparentTexture> {
        const promise = new Promise<TransparentTexture>((res, rej) => {
            const wadTexture: WADTexture | nil = this.textureLibrary.textures[texName];
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
            }else{
                const threeTexture = new THREE.DataTexture(
                    wadTexture.getPixelDataRGBA(this.textureLibrary.fileList),
                    wadTexture.width, wadTexture.height, THREE.RGBAFormat,
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
                res({
                    texture: threeTexture,
                    transparent: wadTexture.isTransparent(this.textureLibrary.fileList)
                });
            }
        });
        return promise;
    }
    protected isWadTexture(foo: ImageData | WADTexture): foo is WADTexture {
        const props = ["name", "flags", "width", "height", "columnDirectory", "patches"];
        for(const prop of props){
            if(!foo.hasOwnProperty(prop)){
                return false;
            }
        }
        return true;
    }
    protected getMaterialIndex(texName: string): number {
        // Get texture, or add it if it has not already been added.
        let matIndex = 0;
        if(this._materials[texName] == null){
            // Texture has not been added. Add it.
            // First, create the material.
            const material = new THREE.MeshBasicMaterial({
                name: texName,
                side: THREE.DoubleSide,
            });
            material.transparent = true;
            material.vertexColors = THREE.VertexColors;
            material.needsUpdate = false;
            // Asynchronously get texture. Missing textures will use an external image file.
            const texPromise = this.optionalTexture(texName);
            this._materialPromises.push(texPromise);
            texPromise.then((transparentTexture) => {
                transparentTexture.texture.name = texName;
                transparentTexture.texture.needsUpdate = true;
                material.map = transparentTexture.texture;
                material.transparent = transparentTexture.transparent;
                material.needsUpdate = true;
            });
            // Add the material to the index map and array.
            matIndex = this._materialArray.length;
            this._materials[texName] = matIndex;
            this._materialArray.push(material);
        }else{
            // Material already has been added, so just use it.
            matIndex = this._materials[texName];
        }
        return matIndex;
    }
    public static rgbToFloat(rgb: number[]){
        return rgb.map((c) => c / 255);
    }
    public rebuild(): THREE.Mesh | null {
        if(!this.map.sides || !this.map.sectors || !this.map.lines || !this.map.vertexes){ return null; }
        // Array of quads - used for rendering walls
        let quads: LineQuad[] = [];
        // Vertices
        const vertices = Array.from(this.map.enumerateVertexes());
        // Construct array of quads from lines and sides
        for(const line of this.map.enumerateLines()){ // All lines are made of 1-3 quads
            const front = this.map.sides.getSide(line.frontSidedef);
            const frontSector = this.map.sectors.getSector(front.sector);
            let back = null;
            const lineX = vertices[line.endVertex].x - vertices[line.startVertex].x;
            const lineY = vertices[line.endVertex].y - vertices[line.startVertex].y;
            const lineLength = Math.sqrt(lineX * lineX + lineY * lineY);
            if(!line.twoSidedFlag){
                // No back side
                const lineHeight = frontSector.ceilingHeight - frontSector.floorHeight;
                const lineTexture = this.getMaterialIndex(front.middle);
                quads.push({
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
                    alignment: line.lowerUnpeggedFlag ? TextureAlignment.LowerUnpegged : TextureAlignment.Normal,
                    worldPanning: true,
                });
            }else{
                back = this.map.sides.getSide(line.backSidedef);
                const backSector = this.map.sectors.getSector(back.sector);
                const heights = getSideHeights(frontSector, backSector);
                if(heights.middleTop - heights.middleBottom > 0){
                    const frontMidtex = this.textureLibrary.textures[front.middle];
                    const backMidtex = this.textureLibrary.textures[back.middle];
                    if(frontMidtex != null){
                        // Front side midtex
                        let midQuadTop = line.lowerUnpeggedFlag ?
                            heights.middleBottom + frontMidtex.height : heights.middleTop;
                        midQuadTop += front.y;
                        midQuadTop = Math.min(heights.middleTop, midQuadTop);
                        let midQuadBottom = midQuadTop - frontMidtex.height;
                        midQuadBottom = Math.max(heights.middleBottom, midQuadBottom);
                        const lineHeight = midQuadTop - midQuadBottom;
                        quads.push({
                            width: lineLength,
                            height: lineHeight,
                            xOffset: front.x,
                            yOffset: front.y,
                            materialIndex: this.getMaterialIndex(front.middle),
                            startX: vertices[line.startVertex].x,
                            startY: -vertices[line.startVertex].y,
                            endX: vertices[line.endVertex].x,
                            endY: -vertices[line.endVertex].y,
                            bottomHeight: midQuadBottom,
                            topHeight: midQuadTop,
                            alignment: TextureAlignment.None,
                            worldPanning: frontMidtex.worldPanning,
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
                        quads.push({
                            width: lineLength,
                            height: lineHeight,
                            xOffset: back.x,
                            yOffset: back.y,
                            materialIndex: this.getMaterialIndex(back.middle),
                            startX: vertices[line.startVertex].x,
                            startY: -vertices[line.startVertex].y,
                            endX: vertices[line.endVertex].x,
                            endY: -vertices[line.endVertex].y,
                            bottomHeight: midQuadBottom,
                            topHeight: midQuadTop,
                            alignment: TextureAlignment.None,
                            worldPanning: backMidtex.worldPanning,
                        });
                    }
                }
                if(heights.front.upperTop > heights.front.upperBottom){
                    // Upper quad on front side
                    quads.push({
                        width: lineLength,
                        height: heights.front.upperTop - heights.front.upperBottom,
                        xOffset: front.x,
                        yOffset: front.y,
                        materialIndex: this.getMaterialIndex(front.upper),
                        startX: vertices[line.startVertex].x,
                        startY: -vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: -vertices[line.endVertex].y,
                        bottomHeight: heights.front.upperBottom,
                        topHeight: heights.front.upperTop,
                        alignment: line.upperUnpeggedFlag ?
                            TextureAlignment.UpperUnpegged : TextureAlignment.Normal,
                        worldPanning: true,
                    });
                }
                if(heights.front.lowerTop > heights.front.lowerBottom){
                    // Lower quad on front side
                    quads.push({
                        width: lineLength,
                        height: heights.front.lowerTop - heights.front.lowerBottom,
                        xOffset: front.x,
                        yOffset: front.y,
                        materialIndex: this.getMaterialIndex(front.lower),
                        startX: vertices[line.startVertex].x,
                        startY: -vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: -vertices[line.endVertex].y,
                        bottomHeight: heights.front.lowerBottom,
                        topHeight: heights.front.lowerTop,
                        alignment: line.lowerUnpeggedFlag ?
                            TextureAlignment.LowerUnpegged : TextureAlignment.Normal,
                        worldPanning: true,
                    });
                }
                if(heights.back.upperTop > heights.back.upperBottom){
                    // Upper quad on back side
                    quads.push({
                        width: lineLength,
                        height: heights.back.upperTop - heights.back.upperBottom,
                        xOffset: back.x,
                        yOffset: back.y,
                        materialIndex: this.getMaterialIndex(back.upper),
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
                        alignment: line.upperUnpeggedFlag ?
                            TextureAlignment.UpperUnpegged : TextureAlignment.Normal,
                        worldPanning: true,
                    });
                }
                if(heights.back.lowerTop > heights.back.lowerBottom){
                    // Lower quad on back side
                    quads.push({
                        width: lineLength,
                        height: heights.back.lowerTop - heights.back.lowerBottom,
                        xOffset: back.x,
                        yOffset: back.y,
                        materialIndex: this.getMaterialIndex(back.lower),
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
                        alignment: line.lowerUnpeggedFlag ?
                            TextureAlignment.LowerUnpegged : TextureAlignment.Normal,
                        worldPanning: true,
                    });
                }
            }
        }
        // Quad triangle vertex indices are laid out like this:
        // 0 ----- 1
        // |     / |
        // |   /   |
        // | /     |
        // 2 ----- 3
        const quadTriVerts = [0, 1, 2, 3, 2, 1];
        // Sort quads by material number so that it is easy to group them
        quads = quads.sort((a, b) => a.materialIndex - b.materialIndex);
        // Set up buffers
        const bufferGeometry = new THREE.BufferGeometry();
        // 6 vertices per quad (3 per triangle)
        // 3 numbers per vertex (XYZ coordinates)
        // 2 numbers per UV coordinate (XY coordinates)
        // 3 numbers per color (RGB channel values)
        const vertexBuffer = new Float32Array(quads.length * 3 * 6);
        const normalBuffer = new Float32Array(quads.length * 3 * 6);
        const uvBuffer = new Float32Array(quads.length * 2 * 6);
        const colorBuffer = new Float32Array(quads.length * 3 * 6);
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
                // Assign new material indices to quads
                for(let quadIndex = 0; quadIndex < quads.length; quadIndex++){
                    const oldMaterialIndex = quads[quadIndex].materialIndex;
                    quads[quadIndex].materialIndex = newMaterialIndices[oldMaterialIndex];
                }
            }
            for(let quadIndex = 0; quadIndex < quads.length; quadIndex++){
                const quad = quads[quadIndex];
                if(quad.materialIndex !== lastMaterialIndex){
                    // Add another group, since the material index changed
                    groups.push({lastIndex, lastCount, lastMaterialIndex});
                    lastIndex = lastIndex + lastCount;
                    lastCount = 0;
                    lastMaterialIndex = quad.materialIndex;
                }
                for(let vertexIterIndex = 0; vertexIterIndex < quadTriVerts.length; vertexIterIndex++) {
                    const vertexIndex = quadTriVerts[vertexIterIndex];
                    const texture = this._materialArray[quad.materialIndex].map;
                    if(texture != null){
                        uvBuffer.set(this.getQuadUVs(texture.image, vertexIndex, quad), quadIndex * 12 + 2 * vertexIterIndex);
                    }
                }
                lastCount += 6;
            }
            // Add the last group
            groups.push({lastIndex, lastCount, lastMaterialIndex});
            for(const group of groups){
                bufferGeometry.addGroup(group.lastIndex, group.lastCount, group.lastMaterialIndex);
            }
        });
        // Add quad positions, normals, and colors to buffers
        for(let quadIndex = 0; quadIndex < quads.length; quadIndex++){
            const quad = quads[quadIndex];
            vertexBuffer.set([
                quad.startX, quad.topHeight, quad.startY, // Upper left
                quad.endX, quad.topHeight, quad.endY, // Upper right
                quad.startX, quad.bottomHeight, quad.startY, // Lower left
                quad.endX, quad.bottomHeight, quad.endY, // Lower right
                quad.startX, quad.bottomHeight, quad.startY, // Lower left
                quad.endX, quad.topHeight, quad.endY, // Upper right
            ], quadIndex * 18);
            const normal = new THREE.Vector2(quad.startX, quad.startY);
            normal.sub(new THREE.Vector2(quad.endX, quad.endY));
            normal.normalize();
            normal.rotateAround(new THREE.Vector2(0, 0), -90 / (180 / Math.PI));
            normalBuffer.set([
                normal.x, 0, normal.y, // Upper left
                normal.x, 0, normal.y, // Upper right
                normal.x, 0, normal.y, // Lower left
                normal.x, 0, normal.y, // Lower right
                normal.x, 0, normal.y, // Lower left
                normal.x, 0, normal.y, // Upper right
            ], quadIndex * 18);
            colorBuffer.set([
                1, 1, 1, // Upper left
                1, 1, 1, // Upper right
                1, 1, 1, // Lower left
                1, 1, 1, // Lower right
                1, 1, 1, // Lower left
                1, 1, 1, // Upper right
            ], quadIndex * 18);
        }
        // Create buffer attributes from the arrays
        const vertexAttribute = new THREE.BufferAttribute(vertexBuffer, 3);
        const normalAttribute = new THREE.BufferAttribute(normalBuffer, 3);
        const uvAttribute = new THREE.BufferAttribute(uvBuffer, 2);
        const colorAttribute = new THREE.BufferAttribute(colorBuffer, 3);
        // Create buffer geometry and assign attributes
        bufferGeometry.addAttribute("position", vertexAttribute);
        bufferGeometry.addAttribute("normal", normalAttribute);
        bufferGeometry.addAttribute("uv", uvAttribute);
        bufferGeometry.addAttribute("color", colorAttribute);
        // const tmpMaterial = new THREE.MeshBasicMaterial({color: Math.floor(Math.random() * 0xffffff)});
        const mesh = new THREE.Mesh(bufferGeometry, this._materialArray);
        return mesh;
    }
}
