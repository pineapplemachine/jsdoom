import * as THREE from "three";

// type nil = null | undefined;

import {WADMap} from '@src/lumps/doom/map';
import {WADTexture,TextureLibrary} from '@src/lumps/doom/textures';
import {WADMapSector} from "@src/lumps/doom/mapSectors";

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
    }
}

interface Mappable {
    // The width of the quad/texture in map units
    width: number,
    // The height of the quad/texture in map units
    height: number,
    // The X scale of the quad or texture.
    xScale?: number,
    // The Y scale of the quad or texture.
    yScale?: number,
}

interface Quad extends Mappable {
    // The X offset of the texture on the quad
    xOffset: number,
    // The Y offset of the texture on the quad
    yOffset: number,
    // The index of the material for this quad
    materialIndex: number,
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
}

// This class takes map data, and creates a 3D mesh from it.
export class MapGeometryBuilder {
    // The map data
    protected map: WADMap;
    // The texture library
    protected textureLibrary: TextureLibrary;
    // Texture for walls and flats with missing textures. Temporary.
    private static _missingTexture: ImageData;
    public static get missingTexture(): ImageData {
        if (this._missingTexture != null) { return this._missingTexture; }
        const imageDataUri = "data:image/png;base64,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";
        // Create image and assign data URI as src
        const image = new Image();
        image.src = imageDataUri;
        // Get the image data by using a temporary canvas
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        MapGeometryBuilder._missingTexture = context.getImageData(0, 0, canvas.width - 1, canvas.height - 1);
        return MapGeometryBuilder._missingTexture;
    }
    protected _materials:{[name: string]: number};
    protected _materialArray: THREE.MeshBasicMaterial[];
    constructor(map: WADMap, textures: TextureLibrary){
        this.map = map;
        this.textureLibrary = textures;
        this._materials = {};
        this._materialArray = [];
    }
    protected getSideQuadUVs(
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
        uvX += quad.xOffset * texelX;
        uvY += quad.yOffset * texelY;
        return [uvX, uvY];
    }
    protected optionalTexture(texName: string): WADTexture | ImageData {
        let tex: WADTexture | ImageData = this.textureLibrary.textures[texName];
        if(tex == null){
            tex = MapGeometryBuilder.missingTexture;
        }
        return tex;
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
        // Get texture
        let matIndex = 0;
        if(this._materials[texName] == null){
            const wadTex = this.optionalTexture(texName);
            let threeTexture: THREE.Texture;
            if(this.isWadTexture(wadTex)){
                threeTexture = new THREE.DataTexture(
                    wadTex.getPixelDataRGBA(this.textureLibrary.fileList),
                    wadTex.width, wadTex.height,
                    THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping,
                    THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.LinearFilter,
                    THREE.LinearFilter, 1
                );
                threeTexture.name = wadTex.name;
            }else{
                threeTexture = new THREE.DataTexture(
                    wadTex.data, wadTex.width, wadTex.height, THREE.RGBAFormat,
                    THREE.UnsignedByteType, THREE.UVMapping, THREE.RepeatWrapping,
                    THREE.RepeatWrapping, THREE.LinearFilter, THREE.LinearFilter,
                    1
                );
                threeTexture.name = "-";
            }
            const material = new THREE.MeshBasicMaterial({
                name: threeTexture.name,
                color: 0xffffff,
                map: threeTexture,
                side: THREE.DoubleSide,
                vertexColors: THREE.VertexColors,
            });
            material.needsUpdate = true;
            matIndex = this._materialArray.length;
            this._materials[texName] = matIndex;
            this._materialArray.push(material);
        }else{
            matIndex = this._materials[texName];
        }
        return matIndex;
    }
    public static rgbToFloat(rgb: number[]){
        return rgb.map((c) => c / 255);
    }
    public rebuild(): THREE.Mesh | null {
        if(!this.map.sides || !this.map.sectors || !this.map.lines || !this.map.vertexes){return null;}
        let vertexArray: number[] = [];
        let normalArray: number[] = [];
        let uvArray: number[] = [];
        let colorArray: number[] = [];
        let quads: LineQuad[] = [];
        // const txMtls:{[name: string]:IndexedMaterial} = {};
        const vertices = Array.from(this.map.enumerateVertexes());
        // Construct array of quads from lines and sides
        for(const line of this.map.enumerateLines()){ // All lines are made of 1-3 quads
            const front = this.map.sides.getSide(line.frontSidedef);
            const frontSector = this.map.sectors.getSector(front.sector);
            let back = null;
            const lineLength = Math.sqrt(
                vertices[line.startVertex].x * vertices[line.startVertex].x +
                vertices[line.startVertex].y * vertices[line.startVertex].y
            );
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
                    startY: vertices[line.startVertex].y,
                    endX: vertices[line.endVertex].x,
                    endY: vertices[line.endVertex].y,
                    bottomHeight: frontSector.floorHeight,
                    topHeight: frontSector.ceilingHeight,
                });
            }else{
                back = this.map.sides.getSide(line.backSidedef);
                const backSector = this.map.sectors.getSector(back.sector);
                const heights = getSideHeights(frontSector, backSector);
                if(heights.middleTop - heights.middleBottom > 0){
                    const frontMidtex = this.textureLibrary.textures[front.middle];
                    const backMidtex = this.textureLibrary.textures[back.middle];
                    // Both front and back quads will have the same top
                    let midQuadTop = line.lowerUnpeggedFlag ? heights.middleTop : heights.middleBottom;
                    midQuadTop += front.y;
                    if(frontMidtex != null){
                        const frontMidQuadBottom = midQuadTop + frontMidtex.height;
                        const lineHeight = Math.min(frontMidtex.height, heights.middleTop - heights.middleBottom);
                        quads.push({
                            width: lineLength,
                            height: lineHeight,
                            xOffset: front.x,
                            yOffset: front.y,
                            materialIndex: this.getMaterialIndex(front.middle),
                            startX: vertices[line.startVertex].x,
                            startY: vertices[line.startVertex].y,
                            endX: vertices[line.endVertex].x,
                            endY: vertices[line.endVertex].y,
                            bottomHeight: frontMidQuadBottom,
                            topHeight: midQuadTop,
                        });
                    }
                    if(backMidtex != null){
                        const backMidQuadBottom = midQuadTop + backMidtex.height;
                        const lineHeight = Math.min(backMidtex.height, heights.middleTop - heights.middleBottom);
                        quads.push({
                            width: lineLength,
                            height: lineHeight,
                            xOffset: back.x,
                            yOffset: back.y,
                            materialIndex: this.getMaterialIndex(back.middle),
                            startX: vertices[line.startVertex].x,
                            startY: vertices[line.startVertex].y,
                            endX: vertices[line.endVertex].x,
                            endY: vertices[line.endVertex].y,
                            bottomHeight: backMidQuadBottom,
                            topHeight: midQuadTop,
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
                        startY: vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: vertices[line.endVertex].y,
                        bottomHeight: heights.front.upperBottom,
                        topHeight: heights.front.upperTop,
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
                        startY: vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: vertices[line.endVertex].y,
                        bottomHeight: heights.front.lowerBottom,
                        topHeight: heights.front.lowerTop,
                    });
                }
                if(heights.back.upperTop > heights.back.upperBottom){
                    // Upper quad on back side
                    quads.push({
                        width: lineLength,
                        height: heights.back.upperTop - heights.back.upperBottom,
                        xOffset: back.x,
                        yOffset: back.y,
                        materialIndex: this.getMaterialIndex(back.middle),
                        startX: vertices[line.startVertex].x,
                        startY: vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: vertices[line.endVertex].y,
                        bottomHeight: heights.back.upperBottom,
                        topHeight: heights.back.upperTop,
                    });
                }
                if(heights.back.lowerTop > heights.back.lowerBottom){
                    // Lower quad on back side
                    quads.push({
                        width: lineLength,
                        height: heights.back.lowerTop - heights.back.lowerBottom,
                        xOffset: back.x,
                        yOffset: back.y,
                        materialIndex: this.getMaterialIndex(back.middle),
                        startX: vertices[line.startVertex].x,
                        startY: vertices[line.startVertex].y,
                        endX: vertices[line.endVertex].x,
                        endY: vertices[line.endVertex].y,
                        bottomHeight: heights.back.lowerBottom,
                        topHeight: heights.back.lowerTop,
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
        // Sort quads by texture name so that different quads with the same texture can be put in the same group
        quads = quads.sort((a, b) => a.materialIndex - b.materialIndex);
        let lastIndex = 0;
        let lastCount = 0;
        let lastMaterialIndex = 0;
        const groups:{
            lastIndex: number;
            lastCount: number;
            lastMaterialIndex: number;
        }[] = [];

        // Add quads to arrays
        for(const quad of quads){
            if(quad.materialIndex !== lastMaterialIndex){
                groups.push({lastIndex, lastCount, lastMaterialIndex});
                lastIndex = lastIndex + lastCount;
                lastCount = 0;
                lastMaterialIndex = quad.materialIndex;
            }
            for(const vertexIndex of quadTriVerts){
                uvArray = uvArray.concat(
                    this.getSideQuadUVs(this._materialArray[quad.materialIndex].map!.image,
                        vertexIndex, quad));
            }
            vertexArray = vertexArray.concat([
                quad.startX, quad.topHeight, quad.startY, // Upper left
                quad.endX, quad.topHeight, quad.endY, // Upper right
                quad.startX, quad.bottomHeight, quad.startY, // Lower left
                quad.endX, quad.bottomHeight, quad.endY, // Lower right
                quad.startX, quad.bottomHeight, quad.startY, // Lower left
                quad.endX, quad.topHeight, quad.endY, // Upper right
            ]);
            const normal = new THREE.Vector2(quad.endX, quad.endY);
            normal.sub(new THREE.Vector2(quad.startX, quad.startY));
            normal.normalize();
            normal.rotateAround(new THREE.Vector2(0, 0), -90 / (180 / Math.PI));
            normalArray = normalArray.concat([
                normal.x, normal.y, 0, // Upper left
                normal.x, normal.y, 0, // Upper right
                normal.x, normal.y, 0, // Lower left
                normal.x, normal.y, 0, // Lower right
                normal.x, normal.y, 0, // Lower left
                normal.x, normal.y, 0, // Upper right
            ]);
            colorArray = colorArray.concat([
                1, 1, 1, // Upper left
                1, 1, 1, // Upper right
                1, 1, 1, // Lower left
                1, 1, 1, // Lower right
                1, 1, 1, // Lower left
                1, 1, 1, // Upper right
            ]);
            lastCount += 2;
        }
        // Add the last group
        groups.push({lastIndex, lastCount, lastMaterialIndex});
        const bufferGeometry = new THREE.BufferGeometry();
        // Create buffer attributes from the arrays
        const vertexBuffer = new THREE.BufferAttribute(Float32Array.from(vertexArray), 3);
        const normalBuffer = new THREE.BufferAttribute(Float32Array.from(normalArray), 3);
        const uvBuffer = new THREE.BufferAttribute(Float32Array.from(uvArray), 2);
        const colorBuffer = new THREE.BufferAttribute(Float32Array.from(colorArray), 3);
        // Create buffer geometry and assign attributes
        bufferGeometry.addAttribute("position", vertexBuffer);
        bufferGeometry.addAttribute("normal", normalBuffer);
        bufferGeometry.addAttribute("uv", uvBuffer);
        bufferGeometry.addAttribute("color", colorBuffer);
        for(const group of groups){
            bufferGeometry.addGroup(group.lastIndex, group.lastCount, group.lastMaterialIndex);
        }
        const tmpMaterial = new THREE.MeshBasicMaterial({color: 0x18da84, wireframe: true});
        const mesh = new THREE.Mesh(bufferGeometry, tmpMaterial);
        return mesh;
    }
}