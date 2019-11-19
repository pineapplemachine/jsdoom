import * as THREE from "three";
import { WEBVR } from "three/examples/jsm/vr/WebVR.js";

import * as map3D from "@src/convert/3DMapBuilder";
import {KeyboardListener} from "./keyboardListener";

import * as lumps from "@src/lumps/index";
import {WADFile} from "@src/wad/file";
import {WADFileList} from "@src/wad/fileList";
import {WADLump} from "@src/wad/lump";

import {TextureSet, TextureLibrary} from "@src/lumps/index";

import {getPng64, bufferbtoa} from "@web/png64";
import * as util from "@web/util";

const win: any = window as any;

// Manages data for these views, so that stuff like the WAD file list and texture library can be reused between views.
class DataManager {
    // The last WAD file loaded
    private lastWadFile: WADFile | null;
    // The WAD file list
    private wadFileList: WADFileList | null;
    // The texture library
    private textureLibrary: TextureLibrary | null;
    constructor(){
        this.lastWadFile = null;
        this.wadFileList = null;
        this.textureLibrary = null;
    }
    // Get WAD file list
    // Makes this file easier to maintain when the proper implementation is added
    getWadFileList(lump: WADLump): WADFileList {
        if(lump.file){
            if(lump.file !== this.lastWadFile || !this.wadFileList){
                this.lastWadFile = lump.file;
                this.wadFileList = new WADFileList([lump.file]);
            }
            return this.wadFileList;
        }else{
            if(!this.wadFileList){
                this.wadFileList = new WADFileList();
            }
            return this.wadFileList;
        }
        return new WADFileList();
    }
    // Get the texture library. If the WAD File list changes, a new texture library is needed.
    getTextureLibrary(lump: WADLump): TextureLibrary {
        // Decide if a new texture library is needed
        let newLibraryNeeded = this.textureLibrary == null;
        // If there is no WAD file list, or the map lump is from a different WAD
        if(this.lastWadFile !== lump.file || this.wadFileList == null){
            newLibraryNeeded = true;
            this.wadFileList = this.getWadFileList(lump);
        }
        // Make a new texture library
        if(newLibraryNeeded){
            console.log("New texture library using", this.wadFileList);
            this.textureLibrary = new TextureLibrary(this.wadFileList);
        }
        return this.textureLibrary!;
    }
}

const sharedDataManager = new DataManager();

// Warn the user before previewing lumps this big
export const BigLumpThreshold: number = 10000;

export type LumpTypeViewFunction = (lump: WADLump, root: HTMLElement) => void;

export class LumpTypeView {
    // Name to display on the button.
    name: string;
    // Icon URL, e.g. "/assets/icons/view-hex".
    icon: string;
    // Function to actually view a lump this way.
    view: LumpTypeViewFunction;
    // Function to clean up before switching to a different view.
    clear: (LumpTypeViewFunction | null);

    constructor(options: {
        name: string,
        icon: string,
        view: LumpTypeViewFunction,
        clear?: LumpTypeViewFunction,
    }){
        this.name = options.name;
        this.icon = options.icon;
        this.view = options.view;
        this.clear = options.clear || null;
    }
}

export function createWarning(message: string, callback: any): any {
    return util.createElement({
        tag: "div",
        class: "lump-view-warning",
        innerText: message + " (Click here to proceed anyway.)",
        onleftclick: callback,
    });
}

export function createError(message: string, parent: HTMLElement): HTMLElement {
    const container = util.createElement({
        tag: "div",
        class: "lump-view-error-container",
        appendTo: parent,
    });
    return util.createElement({
        tag: "p",
        content: message,
        class: "lump-view-error-message",
        appendTo: container,
    });
}

export const LumpTypeViewText = new LumpTypeView({
    name: "Text",
    icon: "assets/icons/view-text.png",
    view: (lump: WADLump, root: HTMLElement) => {
        function showText(): void {
            util.createElement({
                tag: "pre",
                class: "lump-view-text",
                innerText: lump.data ? lump.data.toString("utf-8") : "",
                appendTo: root,
            });
        }
        if(!lump.data){
            return;
        }
        if(lump.length >= BigLumpThreshold){
            root.appendChild(createWarning((
                "This lump is very large and your browser may not be " +
                "able to safely view it."
            ), () => {
                util.removeChildren(root);
                showText();
            }));
        }else if(lump.data && lump.data.some((byte: number) => (
            (byte < 32 || byte === 127) &&
            (byte !== 9 && byte !== 10 && byte !== 13)
        ))){
            root.appendChild(createWarning((
                "This lump contains special control characters and " +
                "probably isn't meant to be viewed as text."
            ), () => {
                util.removeChildren(root);
                showText();
            }));
        }else{
            showText();
        }
    },
});

export const LumpTypeViewHex = new LumpTypeView({
    name: "Hex",
    icon: "assets/icons/view-hex.png",
    view: (lump: WADLump, root: HTMLElement) => {
        function showHex(): void {
            const bytes: string[] = [];
            if(lump.data){
                for(let index: number = 0; index < lump.length; index++){
                    const byte: number = lump.data.readUInt8(index);
                    const byteString: string = byte.toString(16);
                    if(byteString.length > 1){
                        bytes.push("0x" + byteString);
                    }else{
                        bytes.push("0x0" + byteString);
                    }
                }
            }
            util.createElement({
                tag: "div",
                class: "lump-view-hex",
                appendTo: root,
                children: bytes.map((byte: string) => util.createElement({
                    tag: "div",
                    class: "octet",
                    innerText: byte,
                })),
            });
        }
        if(!lump.data){
            return;
        }
        if(lump.length >= BigLumpThreshold){
            root.appendChild(createWarning((
                "This lump is very large and your browser may not be " +
                "able to safely view it."
            ), () => {
                util.removeChildren(root);
                showHex();
            }));
        }else{
            showHex();
        }
    },
});

export const LumpTypeViewPatches = new LumpTypeView({
    name: "Patches",
    icon: "assets/icons/lump-patches.png",
    view: (lump: WADLump, root: HTMLElement) => {
        const table = util.createElement({
            tag: "div",
            classList: ["lump-view-patch-table", "lump-view-list"],
            appendTo: root,
        });
        const patches = lumps.WADPatches.from(lump);
        for(const patchName of patches.enumeratePatchNames()){
            util.createElement({
                tag: "div",
                class: "list-item",
                innerText: patchName,
                appendTo: table,
            });
        }
    },
});

export const LumpTypeViewTextures = new LumpTypeView({
    name: "Textures",
    icon: "assets/icons/lump-textures.png",
    view: (lump: WADLump, root: HTMLElement) => {
        // TODO: Proper WADFileList support
        const files: WADFileList = sharedDataManager.getWadFileList(lump);
        const textures = lumps.WADTextures.from(lump);
        const viewRoot = util.createElement({
            tag: "div",
            class: "lump-view-textures",
            appendTo: root,
        });
        const listElement = util.createElement({
            tag: "div",
            class: "textures-list",
            appendTo: viewRoot,
        });
        const imgContainer = util.createElement({
            tag: "div",
            class: "textures-image-container",
            appendTo: viewRoot,
        });
        const imgElement = util.createElement({
            tag: "img",
            class: "lump-view-image",
            appendTo: imgContainer,
        });
        for(const texture of textures.enumerateTextures()){
            if(!imgElement.src){
                imgElement.src = getPng64(files, texture);
            }
            const texElement = util.createElement({
                tag: "div",
                class: "list-item",
                innerText: texture.name,
                texture: texture,
                appendTo: listElement,
                onleftclick: (event: any) => {
                    imgElement.src = getPng64(files, texture);
                    for(const child of listElement.children){
                        child.classList.remove("selected");
                    }
                    texElement.classList.add("selected");
                },
            });
        }
    },
});

export const LumpTypeViewFlatImage = new LumpTypeView({
    name: "Image",
    icon: "assets/icons/view-image.png",
    view: (lump: WADLump, root: HTMLElement) => {
        // TODO: Proper WADFileList support
        const files: WADFileList = sharedDataManager.getWadFileList(lump);
        const flat: lumps.WADFlat = lumps.WADFlat.from(lump);
        return util.createElement({
            tag: "img",
            class: "lump-view-image",
            src: getPng64(files, flat),
            appendTo: root,
        });
    },
});

export const LumpTypeViewPictureImage = new LumpTypeView({
    name: "Image",
    icon: "assets/icons/view-image.png",
    view: (lump: WADLump, root: HTMLElement) => {
        // TODO: Proper WADFileList support
        const files: WADFileList = sharedDataManager.getWadFileList(lump);
        const picture: lumps.WADPicture = lumps.WADPicture.from(lump);
        return util.createElement({
            tag: "img",
            class: "lump-view-image",
            src: getPng64(files, picture),
            appendTo: root,
        });
    },
});

export const LumpTypeViewRawImage = function(format: string): LumpTypeView {
    return new LumpTypeView({
        name: "Image",
        icon: "assets/icons/view-image.png",
        view: (lump: WADLump, root: HTMLElement) => {
            const data64: string = lump.data ? bufferbtoa(lump.data) : "";
            return util.createElement({
                tag: "img",
                class: "lump-view-image",
                src: `data:image/${format};base64,${data64}`,
                appendTo: root,
            });
        },
    });
};

export const LumpTypeViewRawAudio = function(format: string): LumpTypeView {
    return new LumpTypeView({
        name: "Image",
        icon: "assets/icons/view-image.png",
        view: (lump: WADLump, root: HTMLElement) => {
            const data64: string = lump.data ? bufferbtoa(lump.data) : "";
            const audio = util.createElement({
                tag: "audio",
                class: "lump-view-audio",
                controls: true,
                autoplay: false,
                loop: false,
                appendTo: root,
                src: `data:audio/${format};base64,${data64}`,
            });
        },
    });
};

export const LumpTypeViewMapThings = new LumpTypeView({
    name: "Table",
    icon: "assets/icons/lump-ansi.png",
    view: (lump: WADLump, root: HTMLElement) => {
        const table = util.createElement({
            tag: "div",
            classList: ["lump-view-map-things", "lump-view-list"],
            appendTo: root,
        });
        const things = lumps.WADMapThings.from(lump);
        for(const thing of things.enumerateThings()){
            const thingType = thing.getTypeObject();
            const item = util.createElement({
                tag: "div",
                class: "list-item",
                appendTo: table,
            });
            util.createElement({
                tag: "div",
                class: "position",
                innerText: `(${thing.x}, ${thing.y})`,
                appendTo: item,
            });
            util.createElement({
                tag: "div",
                class: "name",
                innerText: thingType ? thingType.name : thing.type,
                appendTo: item,
            });
        }
    },
});

export interface MapGeometryOptions {
    // Draw dots at each vertex
    drawVertexes?: boolean;
    // Draw lines for each linedef
    drawLines?: boolean;
    // Draw circles for each thing
    drawThings?: boolean;
    // Leave at least this many pixels of blank space between the map
    // geometry and the canvas border. (Defaults to 50px)
    margin?: number;
}

export const LumpTypeViewMapGeometry = function(
    drawOptions: MapGeometryOptions
): LumpTypeView {
    return new LumpTypeView({
        name: "Map",
        icon: "assets/icons/lump-map.png",
        view: (lump: WADLump, root: HTMLElement) => {
            const mapLump: (WADLump | null) = lumps.WADMap.findMarker(lump);
            if(!mapLump){
                return;
            }
            const map = lumps.WADMap.from(mapLump);
            const canvas = util.createElement({
                tag: "canvas",
                class: "lump-view-map-geometry",
                appendTo: root,
            });
            requestAnimationFrame(() => {
                drawMapGeometry(map, canvas, drawOptions);
            });
        },
        clear: (lump: WADLump, root: HTMLElement) => {
            win.drawMapGeometryArgs = {};
            if(win.drawMapGeometryTimeout){
                clearTimeout(win.drawMapGeometryTimeout);
            }
        },
    });
};

win.drawMapGeometryArgs = {};
win.drawMapGeometryTimeout = 0;
window.addEventListener("resize", function(event: any) {
    if(win.drawMapGeometryTimeout){
        clearTimeout(win.drawMapGeometryTimeout);
    }
    if(win.drawMapGeometryArgs.map){
        win.drawMapGeometryTimeout = setTimeout(() => {
            if(!win.drawMapGeometryArgs.map){
                return;
            }
            drawMapGeometry(
                win.drawMapGeometryArgs.map,
                win.drawMapGeometryArgs.canvas,
                win.drawMapGeometryArgs.options
            );
        }, 100);
    }
});

const ThingClassColors = {
    [lumps.WADMapThingClass.Monster]: "#FF0000",
    [lumps.WADMapThingClass.Weapon]: "#FFFF00",
    [lumps.WADMapThingClass.Ammo]: "#FF8800",
    [lumps.WADMapThingClass.Artifact]: "#00AAFF",
    [lumps.WADMapThingClass.Powerup]: "#22BBBB",
    [lumps.WADMapThingClass.Key]: "#FF00FF",
    [lumps.WADMapThingClass.Obstacle]: "#888888",
    [lumps.WADMapThingClass.Decoration]: "#666666",
    [lumps.WADMapThingClass.Romero]: "#AA22FF",
    [lumps.WADMapThingClass.PlayerStart]: "#00FF00",
    [lumps.WADMapThingClass.Spawner]: "#AA7722",
    [lumps.WADMapThingClass.Teleport]: "#55FF22",
};

function drawMapGeometry(
    map: lumps.WADMap, canvas: any, options: MapGeometryOptions
): void {
    win.drawMapGeometryArgs.map = map;
    win.drawMapGeometryArgs.canvas = canvas;
    win.drawMapGeometryArgs.options = options;
    const context = canvas.getContext("2d");
    const mapBox = map.getBoundingBox();
    const mapWidth = mapBox.width;
    const mapHeight = mapBox.height;
    const margin: number = options.margin || 50;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const maxDrawWidth = canvas.width - (2 * margin);
    const maxDrawHeight = canvas.height - (2 * margin);
    const mapRatio = mapWidth / mapHeight;
    const widthRatio = canvas.width / mapWidth;
    const heightRatio = canvas.height / mapHeight;
    let drawWidth: number = 0;
    let drawHeight: number = 0;
    if(widthRatio < heightRatio){
        drawWidth = maxDrawWidth;
        drawHeight = drawWidth / mapRatio;
    }else{
        drawHeight = maxDrawHeight;
        drawWidth = drawHeight * mapRatio;
    }
    function xTransform(x: number): number {
        return margin + ((x - mapBox.left) * drawWidth / mapWidth);
    }
    function yTransform(y: number): number {
        return margin + ((y - mapBox.top) * drawHeight / mapHeight);
    }
    function widthTransform(width: number) : number {
        return width * drawWidth / mapWidth;
    }
    function heightTransform(height: number) : number {
        return height * drawHeight / mapHeight;
    }
    const vertexList = Array.from(map.enumerateVertexes());
    if(options.drawLines){
        // TODO: Automap colors
        const PassableColor: string = "#888888";
        const ImpassableColor: string = "#FFFFFF";
        const PassableActionColor: string = "#2288FF";
        const ImpassableActionColor: string = "#88AAFF";
        for(const line of map.enumerateLines()){
            const special: boolean = line.special !== 0;
            const passable: boolean = !line.impassableFlag;
            if(special && passable){
                context.strokeStyle = PassableActionColor;
            }else if(special && !passable){
                context.strokeStyle = ImpassableActionColor;
            }else if(!special && passable){
                context.strokeStyle = PassableColor;
            }else{ // if(!special && !passable){
                context.strokeStyle = ImpassableColor;
            }
            context.beginPath();
            const start = vertexList[line.startVertex];
            const end = vertexList[line.endVertex];
            if(start && end){
                context.moveTo(xTransform(start.x), yTransform(start.y));
                context.lineTo(xTransform(end.x), yTransform(end.y));
            }
            context.stroke();
            context.closePath();
        }
    }
    if(options.drawVertexes){
        context.fillStyle = "#FFFFFF";
        for(const vertex of vertexList){
            const drawX = xTransform(vertex.x);
            const drawY = yTransform(vertex.y);
            context.fillRect(drawX - 1, drawY - 1, 2, 2);
        }
    }
    if(options.drawThings){
        for(const thing of map.enumerateThings()){
            const type = thing.getTypeObject();
            const radius = type ? type.radius : 16;
            const drawX = xTransform(thing.x);
            const drawY = yTransform(thing.y);
            const drawRadius = Math.max(1, widthTransform(radius));
            context.fillStyle = (
                (type && ThingClassColors[type.class]) || "#FFFFFF"
            );
            context.fillRect(
                drawX - drawRadius, drawY - drawRadius,
                2 * drawRadius, 2 * drawRadius
            );
        }
    }
}

// This function will make the builder build the map in 3D
function ConvertMapToGeometry(lump: WADLump): map3D.MapGeometry | null {
    // Initialize map
    const mapLump: (WADLump | null) = lumps.WADMap.findMarker(lump);
    if(!mapLump){
        return null;
    }
    const map = lumps.WADMap.from(mapLump);
    // Build map mesh
    const mapBuilder = new map3D.MapGeometryBuilder(map);
    return mapBuilder.rebuild();
}

// The type of buffer to get the index of an element from
enum BufferType {
    Vertex,
    Normal,
    UV,
    Color,
}

interface ThreeGroup {
    // The name of the texture/material
    material: string;
    // The index of the starting element
    start: number;
    // The amount of elements this group has
    count: number;
}

class BufferModel {
    // Constants helpful when modifying buffers
    static readonly positionComponents: number = 3;
    static readonly normalComponents: number = 3;
    static readonly uvComponents: number = 2;
    static readonly colorComponents: number = 3;
    // Alpha test value for transparent midtextures
    static readonly alphaTest: number = .1;
    // Placeholder material in case the texture is not in the library
    static readonly nullMappable: map3D.Mappable = {
        width: 64,
        height: 64,
    };
    static readonly nullTexture: THREE.Texture = (() => {
        const loader = new THREE.TextureLoader();
        return loader.load("/assets/textures/missing.png",
        (texture: THREE.Texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearFilter;
        });
    })();
    static readonly nullMaterial = new THREE.MeshBasicMaterial({
        name: "-",
        map: BufferModel.nullTexture,
        vertexColors: THREE.VertexColors,
    });
    // The THREE.js buffer geometry
    protected geometry: THREE.BufferGeometry;
    // The vertex buffer, and its respective attribute
    protected vertexBuffer: Float32Array;
    // protected vertexBufferAttribute: THREE.BufferAttribute;
    // The vertex normal buffer, and its respective attribute
    protected normalBuffer: Float32Array;
    // protected normalBufferAttribute: THREE.BufferAttribute;
    // The uv coordinate buffer, and its respective attribute
    protected uvBuffer: Float32Array;
    // protected uvBufferAttribute: THREE.BufferAttribute;
    // The color buffer, and its respective attribute
    protected colorBuffer: Float32Array;
    // protected colorBufferAttribute: THREE.BufferAttribute;
    // Current element indices for each buffer
    protected vertexElement: number;
    protected normalElement: number;
    protected uvElement: number;
    protected colorElement: number;
    // Array of THREE.js materials
    protected materials: THREE.Material[];
    // Array of THREE.js textures, for disposal
    protected textures: THREE.Texture[];
    // Mapping of names to material indices
    protected materialIndices: {[name: string]: number};

    constructor(triangles: number) {
        // Constants
        const vectorsPerTriangle = 3;
        // Initialize buffer element index helpers
        this.vertexElement = 0;
        this.normalElement = 0;
        this.uvElement = 0;
        this.colorElement = 0;
        // Initialize the buffer and its attributes
        this.geometry = new THREE.BufferGeometry();
        this.vertexBuffer = new Float32Array(triangles * BufferModel.positionComponents * vectorsPerTriangle);
        const vertexBufferAttribute = new THREE.BufferAttribute(this.vertexBuffer, BufferModel.positionComponents);
        this.normalBuffer = new Float32Array(triangles * BufferModel.normalComponents * vectorsPerTriangle);
        const normalBufferAttribute = new THREE.BufferAttribute(this.normalBuffer, BufferModel.normalComponents);
        this.uvBuffer = new Float32Array(triangles * BufferModel.uvComponents * vectorsPerTriangle);
        const uvBufferAttribute = new THREE.BufferAttribute(this.uvBuffer, BufferModel.uvComponents);
        this.colorBuffer = new Float32Array(triangles * BufferModel.colorComponents * vectorsPerTriangle);
        const colorBufferAttribute = new THREE.BufferAttribute(this.colorBuffer, BufferModel.colorComponents);
        this.geometry.setAttribute("position", vertexBufferAttribute);
        this.geometry.setAttribute("normal", normalBufferAttribute);
        this.geometry.setAttribute("uv", uvBufferAttribute);
        this.geometry.setAttribute("color", colorBufferAttribute);
        // Initialize material and texture arrays
        // The null material being the first is necessary because Lilywhite
        // Lilith MAP02 will use the wrong textures on flats.
        this.materials = [BufferModel.nullMaterial];
        this.materialIndices = {"-": 0};
        this.textures = [];
    }

    // Set an element of one of the buffers.
    setBufferElementAt(buffer: BufferType, values: number[], elementIndex: number){
        if(buffer === BufferType.Vertex){
            const arrayIndex = elementIndex * BufferModel.positionComponents;
            this.vertexBuffer.set(values, arrayIndex);
        }else if(buffer === BufferType.Normal){
            const arrayIndex = elementIndex * BufferModel.normalComponents;
            this.normalBuffer.set(values, arrayIndex);
        }else if(buffer === BufferType.UV){
            const arrayIndex = elementIndex * BufferModel.uvComponents;
            this.uvBuffer.set(values, arrayIndex);
        }else if(buffer === BufferType.Color){
            const arrayIndex = elementIndex * BufferModel.colorComponents;
            this.colorBuffer.set(values, arrayIndex);
        }
    }

    // Set an element of one of the buffers, incrementing the buffer index in the process.
    setBufferElement(buffer: BufferType, values: number[], increment: boolean = true){
        if(buffer === BufferType.Vertex){
            if(values.length > 0 && values.length % BufferModel.positionComponents === 0){
                this.setBufferElementAt(buffer, values, this.vertexElement);
                if(increment){
                    this.vertexElement += values.length / BufferModel.positionComponents;
                }
            }
        }else if(buffer === BufferType.Normal){
            if(values.length > 0 && values.length % BufferModel.normalComponents === 0){
                this.setBufferElementAt(buffer, values, this.normalElement);
                if(increment){
                    this.normalElement += values.length / BufferModel.normalComponents;
                }
            }
        }else if(buffer === BufferType.UV){
            if(values.length > 0 && values.length % BufferModel.uvComponents === 0){
                this.setBufferElementAt(buffer, values, this.uvElement);
                if(increment){
                    this.uvElement += values.length / BufferModel.uvComponents;
                }
            }
        }else if(buffer === BufferType.Color){
            if(values.length > 0 && values.length % BufferModel.colorComponents === 0){
                this.setBufferElementAt(buffer, values, this.colorElement);
                if(increment){
                    this.colorElement += values.length / BufferModel.colorComponents;
                }
            }
        }
    }

    // Get the material index for the given material. Return -1 if the material
    // is not in the materials array
    getMaterialIndex(name: string): number {
        if(this.materialIndices[name] == null){
            return -1;
        }
        return this.materialIndices[name];
    }

    // Get the material index for the given material, or add it if it is not in
    // the material array. Return the index of the material in the material array.
    getOrAddMaterial(name: string, material: THREE.Material): number {
        if(this.materialIndices[name] == null){
            this.materialIndices[name] = this.materials.length;
            this.materials.push(material);
        }
        return this.materialIndices[name];
    }

    // Add a "group" to the buffer geometry. This method is largely the same as
    // BufferGeometry.addGroup, but takes a string instead of a number for the
    // material index
    addGroup(group: ThreeGroup){
        const {start, count} = group;
        const materialIndex = this.materialIndices[group.material];
        this.geometry.addGroup(start, count, materialIndex);
    }

    // Dispose of the geometry, materials and textures associated with this model
    dispose(){
        this.geometry.dispose();
        for(const material of this.materials){
            material.dispose();
        }
        for(const texture of this.textures){
            texture.dispose();
        }
    }

    // Add a quad to the buffer.
    addQuad(quad: map3D.LineQuad, library: TextureLibrary){
        function xyzFor(position: map3D.QuadVertexPosition): number[] {
            // Note that midtexture quads MUST be recalculated before
            // calling this function
            // Y position
            const y = ((position === map3D.QuadVertexPosition.UpperLeft) ||
                (position === map3D.QuadVertexPosition.UpperRight)) ?
                quad.topHeight :
                // Bottom height
                quad.topHeight - quad.height;
            // X position
            const x = ((position === map3D.QuadVertexPosition.UpperLeft) ||
                (position === map3D.QuadVertexPosition.LowerLeft)) ?
                quad.startX : quad.endX;
            // Z position
            const z = ((position === map3D.QuadVertexPosition.UpperLeft) ||
                (position === map3D.QuadVertexPosition.LowerLeft)) ?
                quad.startY : quad.endY;
            return [x, y, z];
        }
        // Wall quad triangle vertex indices are laid out like this:
        // 0 ----- 1
        // |     / |
        // |   /   |
        // | /     |
        // 2 ----- 3
        const quadTriVertices: map3D.QuadVertexPosition[] = [
            map3D.QuadVertexPosition.UpperLeft,
            map3D.QuadVertexPosition.LowerLeft,
            map3D.QuadVertexPosition.UpperRight,
            map3D.QuadVertexPosition.LowerRight,
            map3D.QuadVertexPosition.UpperRight,
            map3D.QuadVertexPosition.LowerLeft,
        ];
        const wadTexture = library.get(quad.texture, quad.textureSet);
        const materialIndex: number = (() => {
            const materialName: string = wadTexture ? wadTexture.name : "-";
            const materialIndex = this.getMaterialIndex(materialName);
            if(wadTexture && materialIndex === -1){
                // Get texture data and make a THREE.js texture out of it
                const textureData = library.getRgba(quad.texture, quad.textureSet)!;
                const texture = new THREE.DataTexture(textureData,
                    wadTexture.width, wadTexture.height, THREE.RGBAFormat,
                    THREE.UnsignedByteType, THREE.UVMapping, THREE.RepeatWrapping,
                    THREE.RepeatWrapping, THREE.NearestFilter, THREE.LinearFilter,
                    4);
                // Is the texture transparent?
                const transparent = (
                    library.isTransparent(quad.texture, quad.textureSet) &&
                    // Only midtextures can be transparent
                    quad.place === map3D.LineQuadPlace.Midtexture
                );
                const material = new THREE.MeshBasicMaterial({
                    name: wadTexture.name,
                    map: texture,
                    transparent,
                    alphaTest: transparent ? BufferModel.alphaTest : 0,
                    vertexColors: THREE.VertexColors,
                });
                this.textures.push(texture);
                return this.getOrAddMaterial(wadTexture.name, material);
            }else if(materialIndex >= 0){
                return materialIndex;
            }
            return this.getOrAddMaterial(materialName, BufferModel.nullMaterial);
        })();
        const texture: map3D.Mappable = wadTexture ? wadTexture : BufferModel.nullMappable;
        quad = map3D.MapGeometryBuilder.recalculateMidtex(quad, texture);
        const wallAngle = ((reverse: boolean) => {
            const wallAngle = Math.atan2(
                (quad.startY - quad.endY) / quad.width,
                (quad.startX - quad.endX) / quad.width);
            return reverse ? wallAngle + Math.PI / 2 : wallAngle - Math.PI / 2;
        })(quad.reverse);
        for(let vertexIterIndex = 0; vertexIterIndex < quadTriVertices.length; vertexIterIndex++){
            const quadTriVertex = (
                !quad.reverse ?
                quadTriVertices[vertexIterIndex] :
                quadTriVertices[quadTriVertices.length - vertexIterIndex - 1]);
            const lightLevel = quad.lightLevel / 255;
            this.setBufferElement(BufferType.Vertex, xyzFor(quadTriVertex));
            this.setBufferElement(BufferType.Normal, [Math.cos(wallAngle), 0, Math.sin(wallAngle)]);
            this.setBufferElement(BufferType.UV, map3D.MapGeometryBuilder.getQuadUVs(texture, quadTriVertex, quad));
            this.setBufferElement(BufferType.Color, [lightLevel, lightLevel, lightLevel]);
        }
        return materialIndex;
    }

    // Add a sector triangle to the buffer.
    addTriangle(triangle: map3D.SectorTriangle, library: TextureLibrary){
        const wadTexture = library.get(triangle.texture, triangle.textureSet);
        const materialIndex: number = (() => {
            const materialName: string = wadTexture ? wadTexture.name : "-";
            const materialIndex = this.getMaterialIndex(materialName);
            if(wadTexture && materialIndex === -1){
                const textureData = library.getRgba(triangle.texture, triangle.textureSet);
                const texture = new THREE.DataTexture(textureData!,
                    wadTexture.width, wadTexture.height, THREE.RGBAFormat,
                    THREE.UnsignedByteType, THREE.UVMapping, THREE.RepeatWrapping,
                    THREE.RepeatWrapping, THREE.NearestFilter, THREE.LinearFilter,
                    4);
                const material = new THREE.MeshBasicMaterial({
                    name: wadTexture.name,
                    map: texture,
                    transparent: false,
                    vertexColors: THREE.VertexColors,
                });
                this.textures.push(texture);
                return this.getOrAddMaterial(wadTexture.name, material);
            }else if(materialIndex >= 0){
                return materialIndex;
            }
            return this.getOrAddMaterial(materialName, BufferModel.nullMaterial);
        })();
        const texture: map3D.Mappable = wadTexture ? wadTexture : BufferModel.nullMappable;
        for(let vertexIterIndex = 0; vertexIterIndex < triangle.vertices.length; vertexIterIndex++){
            const vertexIndex = !triangle.reverse ? vertexIterIndex : triangle.vertices.length - vertexIterIndex - 1;
            const vertex = triangle.vertices[vertexIndex];
            const [x, y, z] = [vertex.x, triangle.height, vertex.y];
            const lightLevel = triangle.lightLevel / 255;
            this.setBufferElement(BufferType.Vertex, [x, y, z]);
            this.setBufferElement(BufferType.Normal, [
                triangle.normalVector.x,
                triangle.normalVector.y,
                triangle.normalVector.z,
            ]);
            this.setBufferElement(BufferType.UV, map3D.MapGeometryBuilder.getSectorVertexUVs(vertex, texture));
            this.setBufferElement(BufferType.Color, [lightLevel, lightLevel, lightLevel]);
        }
        return materialIndex;
    }

    // Get the finished THREE.js mesh
    getMesh(name?: string): THREE.Mesh {
        const mesh = new THREE.Mesh(this.geometry, this.materials);
        if(name){
            mesh.name = name;
        }
        return mesh;
    }
}

// Disposable container for a THREE.js model group
interface DisposableGroup {
    // The group
    group: THREE.Group;
    // And the function to dispose of it
    dispose: () => void;
}

function ConvertMapToThree(map: map3D.MapGeometry, textureLibrary: TextureLibrary): DisposableGroup {
    // Get materials for map
    const midQuads: map3D.LineQuad[] = [];
    const wallQuads: map3D.LineQuad[] = [];
    for(const wall of map.wallQuads){
        if(wall.place === map3D.LineQuadPlace.Midtexture){
            // Midtexture quads are the only quads which could possibly be transparent
            midQuads.push(wall);
        }else{
            wallQuads.push(wall);
        }
    }
    // Sort wall quads, midtexture quads, and sector triangles by material name
    wallQuads.sort((a, b) => a.texture.localeCompare(b.texture));
    midQuads.sort((a, b) => a.texture.localeCompare(b.texture));
    map.sectorTriangles.sort((a, b) => a.texture.localeCompare(b.texture));
    // Set up each model, and group helper
    const wallModel: BufferModel = new BufferModel(wallQuads.length * 2);
    const midModel: BufferModel = new BufferModel(midQuads.length * 2);
    const flatModel: BufferModel = new BufferModel(map.sectorTriangles.length);
    const currentGroup: ThreeGroup = {
        material: map.sectorTriangles[0].texture,
        start: 0,
        count: 0,
    };
    const mapMeshGroup = new THREE.Group();
    // Add sector polygon positions, normals, and colors to buffers
    for(const triangle of map.sectorTriangles){
        if(triangle.texture !== currentGroup.material){
            flatModel.addGroup(currentGroup);
            currentGroup.start += currentGroup.count;
            currentGroup.count = 0;
            currentGroup.material = triangle.texture;
        }
        flatModel.addTriangle(triangle, textureLibrary);
        currentGroup.count += 3;
    }
    flatModel.addGroup(currentGroup);
    mapMeshGroup.add(flatModel.getMesh("flats"));
    // Now add the one-sided/upper/lower quads
    currentGroup.start = 0;
    currentGroup.count = 0;
    currentGroup.material = wallQuads[0].texture;
    for(const wall of wallQuads){
        if(wall.texture !== currentGroup.material){
            wallModel.addGroup(currentGroup);
            currentGroup.start += currentGroup.count;
            currentGroup.count = 0;
            currentGroup.material = wall.texture;
        }
        wallModel.addQuad(wall, textureLibrary);
        currentGroup.count += 6;
    }
    wallModel.addGroup(currentGroup);
    mapMeshGroup.add(wallModel.getMesh("walls"));
    // Add the midtexture quads
    currentGroup.start = 0;
    currentGroup.count = 0;
    currentGroup.material = midQuads.length > 0 ? midQuads[0].texture : "-";
    for(const wall of midQuads){
        if(wall.texture !== currentGroup.material){
            midModel.addGroup(currentGroup);
            currentGroup.start += currentGroup.count;
            currentGroup.count = 0;
            currentGroup.material = wall.texture;
        }
        midModel.addQuad(wall, textureLibrary);
        currentGroup.count += 6;
    }
    midModel.addGroup(currentGroup);
    mapMeshGroup.add(midModel.getMesh("midtextures"));
    return {
        group: mapMeshGroup,
        dispose: () => {
            flatModel.dispose();
            wallModel.dispose();
            midModel.dispose();
        }
    };
}

interface Map3DViewOptions {
    // The vertical FOV to use
    fov?: number;
    // Whether or not to use textures. Turning this off can provide a huge
    // performance boost.
    textured: boolean;
}

const LumpTypeViewMap3D = function(
    options: Map3DViewOptions
): LumpTypeView {
    // Pointer lock related stuff
    let mouseController: ((event: MouseEvent) => void) | null = null;
    const makeMouseController = (direction: THREE.Spherical): (event: MouseEvent) => void => {
        mouseController = (event: MouseEvent) => {
            direction.theta -= event.movementX / (180 / Math.PI);
            direction.phi -= event.movementY / (180 / Math.PI);
            direction.makeSafe();
        };
        return mouseController;
    };
    let hasPointerLock = false;
    const lockPointer = () => {
        if(!mouseController){
            return;
        }
        if(hasPointerLock){
            document.removeEventListener("mousemove", mouseController);
        }else{
            document.addEventListener("mousemove", mouseController);
        }
        hasPointerLock = !hasPointerLock;
    };
    // Ensure the resize event handler can be unbound in clear()
    let onResize: () => void = () => {};
    // Stuff to dispose when 3D view is cleared
    const disposables: {dispose(): void}[] = [];
    return new LumpTypeView({
        name: "Map (3D)",
        icon: "assets/icons/lump-map.png",
        view: (lump: WADLump, root: HTMLElement) => {
            // Get map lump
            const mapLump: (WADLump | null) = lumps.WADMap.findMarker(lump);
            if(!mapLump){
                createError("Could not find the map lump", root);
                return null;
            }
            // Get map from the lump and attempt to convert it to 3D
            const map = lumps.WADMap.from(mapLump);
            let convertedMap: map3D.MapGeometry | null = null;
            try{
                convertedMap = ConvertMapToGeometry(lump);
                if(!convertedMap){
                    createError("Could not find the map lump", root);
                    return null;
                }
            }catch(error){
                createError(`Error: ${error}`, root);
                return null;
            }
            // Now that the map geometry has been converted, convert it to a
            // model that can be used by THREE.js.
            const meshGroup = ConvertMapToThree(
                convertedMap,
                sharedDataManager.getTextureLibrary(lump)
            );
            const scene = new THREE.Scene();
            disposables.push(scene);
            // Create temporary material with random color
            /*
            const tempMaterialColor: THREE.Color = (() => {
                const hue = Math.floor(Math.random() * 360);
                const lightness = Math.round(Math.random() * 50 + 20);
                return new THREE.Color(`hsl(${hue}, 100%, ${lightness}%)`);
            })();
            const tempMaterial = new THREE.MeshBasicMaterial(
                {color: tempMaterialColor.getHex(), wireframe: true});
            for(const object of meshGroup.group.children){
                const mesh = object as THREE.Mesh;
                mesh.material = tempMaterial;
            }
            */
            // Add group to scene and disposables array
            scene.add(meshGroup.group);
            disposables.push(meshGroup);
            /*
            // Add helpers to ensure I got the normals right
            const nameColours: {[name: string]: number} = {
                "flats": 0xff0000,
                "walls": 0x00ff00,
                "midtextures": 0x0000ff,
            };
            for(const mapMesh of meshGroup.group.children){
                const colour = nameColours.hasOwnProperty(mapMesh.name) ? nameColours[mapMesh.name] : 0xff00ff;
                const vnh = new THREE.VertexNormalsHelper(mapMesh, 8, colour);
                scene.add(vnh);
            }
            */
            // Set up canvas
            const canvas = util.createElement({
                tag: "canvas",
                class: "lump-view-map-geometry",
                onleftclick: () => {
                    // Lock pointer if user left-clicks on 3D view
                    if(!hasPointerLock){
                        canvas.requestPointerLock();
                    }
                },
                appendTo: root,
            });
            // Prefer WebGL2 context, since that allows non-power-of-2 textures to tile
            let context = canvas.getContext("webgl2", {
                alpha: true,
            });
            // Fall back to WebGL context if WebGL2 is unavailable
            if(!context){
                context = canvas.getContext("webgl", {
                    alpha: true,
                });
            }
            document.addEventListener("pointerlockchange", lockPointer);
            // Initialize scene, renderer, and camera
            const renderer = new THREE.WebGLRenderer({
                canvas,
                context,
                antialias: false,
                powerPreference: "high-performance",
            });
            renderer.setSize(root.clientWidth, root.clientHeight);
            // Allow VR
            root.appendChild(WEBVR.createButton(renderer));
            renderer.vr.enabled = true;
            const controller = renderer.vr.getController(0);
            disposables.push(renderer);
            // VR controls
            let viewHeadMoving = false;
            controller.addEventListener("selectstart", () => {
                viewHeadMoving = true;
            });
            controller.addEventListener("selectend", () => {
                viewHeadMoving = false;
            });
            // Set up camera
            const camera = new THREE.PerspectiveCamera(
                options.fov || 90, // FOV
                root.clientWidth / root.clientHeight, // Aspect ratio
                1, // Near clip
                10000, // Far clip
            );
            // Set up keyboard controls
            const keyboardControls = new KeyboardListener();
            disposables.push(keyboardControls);
            // Bind resize event handler
            onResize = () => {
                canvas.width = root.clientWidth;
                canvas.height = root.clientHeight;
                camera.aspect = canvas.width / canvas.height;
                camera.updateProjectionMatrix();
                renderer.setSize(root.clientWidth, root.clientHeight);
            };
            window.addEventListener("resize", onResize);
            // Set viewpoint from player 1 start
            const viewHead = new THREE.Object3D(); // Also for VR camera
            const playerStart = map.getPlayerStart(1);
            viewHead.position.set(
                playerStart ? playerStart.x : 0,
                0, playerStart ? -playerStart.y : 0);
            viewHead.add(camera);
            scene.add(viewHead);
            // Direction control
            const playerAngle = playerStart ? // Player angle is 0-360 degrees
                playerStart.angle / (180 / Math.PI) : 0;
            const directionSphere = new THREE.Spherical(
                1, 90 / (180 / Math.PI), playerAngle);
            makeMouseController(directionSphere);
            const render = () => {
                // Movement in VR
                if(renderer.vr.isPresenting()){
                    // Reset viewHead rotation
                    viewHead.setRotationFromQuaternion(new THREE.Quaternion());
                    if(viewHeadMoving){
                        const destination = new THREE.Vector3(0, 0, 1);
                        destination.applyQuaternion(renderer.vr.getCamera(camera).quaternion);
                        viewHead.translateOnAxis(destination, -10);
                    }
                }else{
                    // WASD controls - moves camera around
                    if(keyboardControls.keyState["w"]){
                        viewHead.translateZ(-10); // Forward
                    }
                    if(keyboardControls.keyState["s"]){
                        viewHead.translateZ(10); // Backward
                    }
                    if(keyboardControls.keyState["a"]){
                        viewHead.translateX(-10); // Left
                    }
                    if(keyboardControls.keyState["d"]){
                        viewHead.translateX(10); // Right
                    }
                    // Set view head direction (for non-VR users)
                    const lookAtMe = new THREE.Vector3();
                    lookAtMe.setFromSpherical(directionSphere).add(viewHead.position);
                    viewHead.lookAt(lookAtMe);
                }
                // Render
                camera.updateProjectionMatrix();
                renderer.render(scene, camera);
            };
            renderer.setAnimationLoop(render); // Needed for VR support
        },
        clear: () => {
            window.removeEventListener("resize", onResize);
            if(mouseController){
                document.removeEventListener("mousemove", mouseController);
            }
            for(const disposableThing of disposables){
                disposableThing.dispose();
            }
        }
    });
};

export const LumpTypeViewMapTextured3D = function(): LumpTypeView {
    const view = LumpTypeViewMap3D({textured: true});
    view.name = "Map (3D)";
    return view;
};

export const LumpTypeViewMapUntextured3D = function(): LumpTypeView {
    const view = LumpTypeViewMap3D({textured: false});
    view.name = "Map (Wireframe)";
    return view;
};

// Side of an OBJ face
interface OBJFaceSide {
    // Absolute (positive) 1-based index of the vertex
    vertexIndex: number;
    // Absolute 1-based index of the UV coordinate associated with the vertex
    uvIndex: number;
    // Absolute 1-based index of the normal vector associated with the vertex
    normalIndex: number;
}

interface OBJFace {
    // Sides
    sides: OBJFaceSide[];
    // Name of OBJ material
    material: string;
}

function ConvertMapToOBJ(
    convertedMap: map3D.MapGeometry,
    textureLibrary: TextureLibrary,
    rawMtlNames: boolean = false,
): string {
    // Mappable for null texture and "-" on lower/upper parts
    const nullMappable = {width: 64, height: 64};
    // OBJ faces, vertices, UVs, and normals
    const objFaces: OBJFace[] = [];
    const objVertices: number[] = [];
    const objUVs: number[] = [];
    const objNormals: number[] = [];
    // Angle to normal index mapping
    const angleNormals: {[angle: number]: number} = {};
    // Flat normal vector to normal index mapping
    const flatNormals: {[vectorString: string]: number} = {};
    // Vertex vector to vertex index mapping
    const vertices: {[vectorString: string]: number} = {};
    // UV vector to UV index mapping
    const uvs: {[vectorString: string]: number} = {};
    // OBJ index of last vertex/UV/normal
    let objVertexIndex = 1;
    let objUvIndex = 1;
    let objNormalIndex = 1;
    // Get all of the textures used by the map
    const objTextures: {[name: string]: map3D.Mappable} = {};
    for(let wall of convertedMap.wallQuads){
        // Get the texture
        const textureKey = rawMtlNames ? wall.texture : `${TextureSet[wall.textureSet]}[${wall.texture}]`;
        if(!objTextures[textureKey]){
            const texture = textureLibrary.get(wall.texture, wall.textureSet);
            objTextures[textureKey] = texture ? texture : nullMappable;
        }
        wall = map3D.MapGeometryBuilder.recalculateMidtex(wall, objTextures[textureKey]);
        const bottomHeight = wall.topHeight - wall.height;
        // 4 vertices per quad
        const vertexPositions: map3D.QuadVertexPosition[] = [
            map3D.QuadVertexPosition.UpperRight,
            map3D.QuadVertexPosition.UpperLeft,
            map3D.QuadVertexPosition.LowerLeft,
            map3D.QuadVertexPosition.LowerRight,
        ];
        const vertexIndices: number[] = [0, 0, 0, 0];
        const uvIndices: number[] = [0, 0, 0, 0];
        for(let vertexIterIndex: number = 0;
            vertexIterIndex < vertexPositions.length; vertexIterIndex++
        ){
            const vertexPosition = vertexPositions[vertexIterIndex];
            let wallPlaceChar = "c";
            if(wall.place !== map3D.LineQuadPlace.Middle){
                // All vertices of an upper quad are connected to ceilings on
                // both sides. Likewise, all vertices of a lower quad are
                // connected to floors on both sides.
                if((wall.place === map3D.LineQuadPlace.Lower) ||
                    (wall.topHeight - wall.height === wall.floorHeight)
                ){
                    wallPlaceChar = "f";
                }
            }else{
                // This is a one-sided line quad.
                if((vertexPosition === map3D.QuadVertexPosition.LowerLeft) ||
                    (vertexPosition === map3D.QuadVertexPosition.LowerRight)
                ){
                    wallPlaceChar = "f";
                }
            }
            if(wall.reverse){
                // Separates back midtextures from front midtextures
                wallPlaceChar += "r";
            }
            // XYZ coordinates for the vertex
            const x = (() => {
                if((vertexPosition === map3D.QuadVertexPosition.UpperLeft) ||
                    (vertexPosition === map3D.QuadVertexPosition.LowerLeft)
                ){
                    // Left
                    return wall.startX;
                }
                // Right
                return wall.endX;
            })();
            const z = (() => {
                if((vertexPosition === map3D.QuadVertexPosition.UpperLeft) ||
                    (vertexPosition === map3D.QuadVertexPosition.LowerLeft)
                ){
                    // Left
                    return wall.startY;
                }
                // Right
                return wall.endY;
            })();
            const y = (() => {
                if((vertexPosition === map3D.QuadVertexPosition.UpperLeft) ||
                    (vertexPosition === map3D.QuadVertexPosition.UpperRight)
                ){
                    // Upper
                    return wall.topHeight;
                }
                // Lower
                return bottomHeight;
            })();
            const vertexKey = `${x} ${y} ${z}${wallPlaceChar}`;
            if(vertices[vertexKey] == null){
                objVertices.push(x, y, z);
                vertices[vertexKey] = objVertexIndex;
                objVertexIndex++;
            }
            vertexIndices[vertexIterIndex] = vertices[vertexKey];
            const quadUVs = map3D.MapGeometryBuilder.getQuadUVs(
                objTextures[textureKey], vertexPosition, wall
            );
            // OBJ UV Y coordinates seem to be inverted.
            quadUVs[1] = 1 - quadUVs[1];
            const uvKey = `${quadUVs[0]} ${quadUVs[1]}`;
            if(uvs[uvKey] == null){
                uvs[uvKey] = objUvIndex;
                objUVs.push(quadUVs[0], quadUVs[1]);
                objUvIndex++;
            }
            uvIndices[vertexIterIndex] = uvs[uvKey];
        }
        // wall.width is the same as the length
        const wallAngle = ((reverse: boolean) => {
            const wallAngle = Math.atan2(
                (wall.startY - wall.endY) / wall.width,
                (wall.startX - wall.endX) / wall.width);
            return reverse ? wallAngle + Math.PI / 2 : wallAngle - Math.PI / 2;
        })(wall.reverse);
        if(angleNormals[wallAngle] == null){
            angleNormals[wallAngle] = objNormalIndex;
            objNormals.push(
                // Normals are the same for every vertex on this wall
                Math.cos(wallAngle), 0, Math.sin(wallAngle)
            );
            objNormalIndex++;
        }
        const face: OBJFace = {
            material: textureKey,
            sides: [],
        };
        for(let sideIndex = 0; sideIndex < 4; sideIndex++){
            face.sides.push({
                vertexIndex: vertexIndices[sideIndex],
                uvIndex: uvIndices[sideIndex],
                normalIndex: angleNormals[wallAngle],
            });
        }
        objFaces.push(face);
    }
    for(const flat of convertedMap.sectorTriangles){
        const textureKey = rawMtlNames ? flat.texture : `${TextureSet[flat.textureSet]}[${flat.texture}]`;
        if(!objTextures[textureKey]){
            const texture = textureLibrary.get(flat.texture, flat.textureSet);
            objTextures[textureKey] = texture ? texture : nullMappable;
        }
        const face: OBJFace = {
            material: textureKey,
            sides: [],
        };
        const normalString = `${flat.normalVector.x} ${flat.normalVector.y} ${flat.normalVector.z}`;
        if(flatNormals[normalString] == null){
            flatNormals[normalString] = objNormalIndex;
            objNormals.push(flat.normalVector.x, flat.normalVector.y, flat.normalVector.z);
            objNormalIndex++;
        }
        for(const vertexVector of flat.vertices){
            const [x, y, z] = [vertexVector.x, flat.height, vertexVector.y];
            const placeChar = flat.place === map3D.SectorTrianglePlace.Floor ? "f" : "c";
            const vertexKey = `${x} ${y} ${z}${placeChar}`;
            if(vertices[vertexKey] == null){
                vertices[vertexKey] = objVertexIndex;
                objVertices.push(vertexVector.x, flat.height, vertexVector.y);
                objVertexIndex++;
            }
            const uv = map3D.MapGeometryBuilder.getSectorVertexUVs(
                vertexVector, objTextures[textureKey]);
            const uvKey = `${uv[0]} ${uv[1]}`;
            if(uvs[uvKey] == null){
                uvs[uvKey] = objUvIndex;
                objUVs.push(uv[0], uv[1]);
                objUvIndex++;
            }
            face.sides.push({
                vertexIndex: vertices[vertexKey],
                uvIndex: uvs[uvKey],
                normalIndex: flatNormals[normalString],
            });
        }
        if(flat.reverse){
            face.sides.reverse();
        }
        objFaces.push(face);
    }
    // stringify the OBJ
    let objText = "# OBJ generated by jsdoom\n";
    // Add vertices
    objVertices.forEach((coordinate, index) => {
        if(index % 3 === 0){
            objText += "\nv";
        }
        objText += ` ${coordinate}`;
    });
    // Add UVs
    objUVs.forEach((coordinate, index) => {
        if(index % 2 === 0){
            objText += "\nvt";
        }
        objText += ` ${coordinate}`;
    });
    // Add normals
    objNormals.forEach((coordinate, index) => {
        if(index % 3 === 0){
            objText += "\nvn";
        }
        objText += ` ${coordinate}`;
    });
    // Sort by material name
    objFaces.sort((a, b) => a.material.localeCompare(b.material));
    let currentMaterial = "";
    // Doom maps don't have smooth groups
    objText += "\ns off";
    // Add faces
    for(const face of objFaces){
        if(face.material !== currentMaterial){
            objText += `\nusemtl ${face.material}`;
            currentMaterial = face.material;
        }
        objText += "\nf";
        for(const side of face.sides){
            objText += ` ${side.vertexIndex}/${side.uvIndex}/${side.normalIndex}`;
        }
    }
    return objText;
}

export const LumpTypeViewMapOBJ = function(rawMtlNames: boolean = false): LumpTypeView {
    return new LumpTypeView({
        name: "Map (OBJ)",
        icon: "assets/icons/view-text.png",
        view: (lump: WADLump, root: HTMLElement) => {
            function showText(text: string): void {
                util.createElement({
                    tag: "pre",
                    class: "lump-view-text",
                    content: text,
                    appendTo: root,
                });
            }
            util.createElement({
                type: "p",
                class: "lump-view-text",
                content: "Please wait...",
                appendTo: root,
            });
            let convertedMap: map3D.MapGeometry | null = null;
            try{
                convertedMap = ConvertMapToGeometry(lump);
                if(!convertedMap){
                    util.removeChildren(root);
                    createError("Could not find the map lump", root);
                    return;
                }
            }catch(error){
                createError(`${error}`, root);
                return;
            }
            const textureLibrary = sharedDataManager.getTextureLibrary(lump);
            const objText = ConvertMapToOBJ(convertedMap, textureLibrary, rawMtlNames);
            util.removeChildren(root);
            if(objText.length >= BigLumpThreshold){
                root.appendChild(createWarning((
                    "This OBJ is very large and your browser may not be " +
                    "able to safely view it."
                ), () => {
                    util.removeChildren(root);
                    showText(objText);
                }));
            }else{
                showText(objText);
            }
        },
    });
};

interface MTLLibName {
    // Name of OBJ material
    texture: string;
    // Name of image file, without the extension
    file: string;
}

function ConvertMapToMTL(convertedMap: map3D.MapGeometry, rawMtlNames: boolean = false): string {
    const textureNames: MTLLibName[] = [];
    const quadCountByTexture: {[texture: string]: number} = {};
    const flatCountByTexture: {[texture: string]: number} = {};
    // Get all of the quad texture names
    for(const quad of convertedMap.wallQuads){
        const textureKey = `${TextureSet[quad.textureSet]}[${quad.texture}]`;
        if(quadCountByTexture[textureKey] == null){
            quadCountByTexture[textureKey] = 1;
            textureNames.push({
                texture: rawMtlNames ? quad.texture : textureKey,
                file: quad.texture,
            });
        }
    }
    for(const flat of convertedMap.sectorTriangles){
        const textureKey = `${TextureSet[flat.textureSet]}[${flat.texture}]`;
        if(flatCountByTexture[textureKey] == null){
            flatCountByTexture[textureKey] = 1;
            textureNames.push({
                texture: rawMtlNames ? flat.texture : textureKey,
                file: flat.texture,
            });
        }
    }
    let mtlText = "# MTL generated by jsdoom\n\n";
    for(const name of textureNames){
        mtlText += (
            `newmtl ${name.texture}\n` +
            "Kd 1.0 1.0 1.0\n" +
            "illum 1\n" +
            `map_Kd ${name.file}.png\n\n`
        );
    }
    return mtlText;
}

export const LumpTypeViewMapMTL = function(): LumpTypeView {
    return new LumpTypeView({
        name: "Map (MTL)",
        icon: "assets/icons/view-text.png",
        view: (lump: WADLump, root: HTMLElement) => {
            function showText(text: string): void {
                util.createElement({
                    tag: "pre",
                    class: "lump-view-text",
                    content: text,
                    appendTo: root,
                });
            }
            util.createElement({
                type: "p",
                class: "lump-view-text",
                content: "Please wait...",
                appendTo: root,
            });
            let convertedMap: map3D.MapGeometry | null = null;
            try{
                convertedMap = ConvertMapToGeometry(lump);
                if(!convertedMap){
                    util.removeChildren(root);
                    createError("Could not find the map lump", root);
                    return;
                }
            }catch(error){
                createError(`${error}`, root);
                return;
            }
            const mtlText = ConvertMapToMTL(convertedMap);
            util.removeChildren(root);
            if(mtlText.length >= BigLumpThreshold){
                root.appendChild(createWarning((
                    "This lump is very large and your browser may not be " +
                    "able to safely view it."
                ), () => {
                    util.removeChildren(root);
                    showText(mtlText);
                }));
            }else{
                showText(mtlText);
            }
        },
    });
};

// Options used by makeSequentialView
interface SequentialViewOptions {
    root: HTMLElement;
    initialIndex?: number;
    getMaxIndex: () => number;
    getPositionText?: (index: number) => string;
    getDescriptionText?: (index: number) => string;
    onReady?: (container: HTMLElement, index: number) => void;
    onChangeIndex?: (index: number) => void;
}

// Helper to construct DOM elements for viewing items individually in a
// sequence, such as the palettes in a PLAYPAL lump.
function makeSequentialView(options: SequentialViewOptions): HTMLElement {
    let currentIndex: number = options.initialIndex || 0;
    const getPositionText = options.getPositionText || ((index) => {
        return `${index + 1} of ${options.getMaxIndex()}`;
    });
    const outerContainer = util.createElement({
        class: "lump-view-sequential",
        appendTo: options.root,
    });
    const innerContainer = util.createElement({
        class: "inner-container",
        appendTo: outerContainer,
    });
    const positionTextElement = util.createElement({
        class: "counter",
        appendTo: innerContainer,
    });
    const descriptionTextElement = util.createElement({
        class: "description",
        appendTo: innerContainer,
    });
    const contentContainer = util.createElement({
        class: "content-container",
        appendTo: innerContainer,
    });
    // Helper that runs whenever the viewed index changes
    function handleIndexChange(): void {
        positionTextElement.innerText = getPositionText(currentIndex);
        if(options.getDescriptionText){
            descriptionTextElement.style.display = null;
            descriptionTextElement.innerText = (
                options.getDescriptionText(currentIndex)
            );
        }else{
            descriptionTextElement.style.display = "none";
        }
    }
    const prevArrow = util.createElement({
        content: "«",
        classList: ["arrow-button", "left-arrow-button"],
        appendTo: innerContainer,
        onleftclick: () => {
            const maxIndex: number = options.getMaxIndex();
            currentIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex - 1;
            handleIndexChange();
            if(options.onChangeIndex){
                options.onChangeIndex(currentIndex);
            }
        },
    });
    const nextArrow = util.createElement({
        content: "»",
        classList: ["arrow-button", "right-arrow-button"],
        appendTo: innerContainer,
        onleftclick: () => {
            const maxIndex: number = options.getMaxIndex();
            currentIndex = (currentIndex + 1) % maxIndex;
            handleIndexChange();
            if(options.onChangeIndex){
                options.onChangeIndex(currentIndex);
            }
        },
    });
    handleIndexChange();
    if(options.onReady){
        options.onReady(contentContainer, currentIndex);
    }
    return contentContainer;
}

export function LumpTypeViewPlaypal(
    scaleX: number = 4, scaleY: number = 4
): LumpTypeView {
    return new LumpTypeView({
        name: "Playpal",
        icon: "assets/icons/lump-playpal.png",
        view: (lump: WADLump, root: HTMLElement) => {
            const playpal = lumps.WADPalette.from(lump);
            // Create a canvas element and a rendering context
            const canvas = util.createElement({
                tag: "canvas",
                width: 16 * scaleX, // 16 columns
                height: 16 * scaleY, // 16 rows
            });
            const context = (
                canvas.getContext("2d") as CanvasRenderingContext2D
            );
            // Render the palette at an index to the created canvas element
            function renderPalette(paletteIndex: number) {
                for (let colorIndex = 0; colorIndex < 256; colorIndex++) {
                    // Calculate position to draw
                    const column = (colorIndex % 16) * scaleX;
                    const row = (Math.floor(colorIndex / 16)) * scaleY;
                    // Set color and draw
                    context.fillStyle = (
                        playpal.getColorHex(paletteIndex, colorIndex)
                    );
                    context.fillRect(column, row, scaleX, scaleY);
                }
            }
            // Create a view for browsing the palettes in the lump
            makeSequentialView({
                root: root,
                initialIndex: 0,
                getMaxIndex: () => playpal.getPaletteCount(),
                getPositionText: (index: number) => {
                    return `Palette ${index + 1} of ${playpal.getPaletteCount()}`;
                },
                onReady: (container: HTMLElement, index: number) => {
                    container.appendChild(canvas);
                    renderPalette(index);
                },
                onChangeIndex: (index: number) => {
                    renderPalette(index);
                },
            });
        }
    });
}

export function LumpTypeViewColormapAll(scaleX: number = 2, scaleY: number = 2) {
    return new LumpTypeView({
        name: "Image",
        icon: "assets/icons/view-image.png",
        view: (lump: WADLump, root: HTMLElement) => {
            const files = sharedDataManager.getWadFileList(lump);
            const colormap: lumps.WADColorMap = lumps.WADColorMap.from(lump);
            const playpal: lumps.WADPalette = files.getPlaypal();
            // Set up canvas and rendering context
            const canvas = util.createElement({
                tag: "canvas",
                class: "lump-view-image",
                appendTo: root,
                // One column per palette color
                width: lumps.WADPalette.ColorsPerPalette * scaleX,
                // One row per colormap
                height: colormap.getMapCount() * scaleY,
            });
            const context = (
                canvas.getContext("2d") as CanvasRenderingContext2D
            );
            // Draw all colormaps
            const mapCount: number = colormap.getMapCount();
            const colorCount: number = lumps.WADPalette.ColorsPerPalette;
            for (let mapIndex = 0; mapIndex < mapCount; mapIndex++) {
                for (let colorIndex = 0; colorIndex < colorCount; colorIndex++) {
                    // Calculate position to draw
                    const row = mapIndex * scaleY;
                    const column = colorIndex * scaleX;
                    // Set color and draw
                    const paletteIndex = colormap.getColor(mapIndex, colorIndex);
                    context.fillStyle = playpal.getColorHex(0, paletteIndex);
                    context.fillRect(column, row, scaleX, scaleY);
                }
            }
        }
    });
}

export function LumpTypeViewColormapByMap(
    scaleX: number = 4, scaleY: number = 4
): LumpTypeView {
    return new LumpTypeView({
        name: "Colormap",
        icon: "assets/icons/lump-colormap.png",
        view: (lump: WADLump, root: HTMLElement) => {
            const files = sharedDataManager.getWadFileList(lump);
            const playpal = files.getPlaypal();
            const colormap = lumps.WADColorMap.from(lump);
            // Create a canvas element and a rendering context
            const canvas = util.createElement({
                tag: "canvas",
                width: 16 * scaleX, // 16 columns
                height: 16 * scaleY, // 16 rows
            });
            const context = (
                canvas.getContext("2d") as CanvasRenderingContext2D
            );
            // Render the palette at an index to the created canvas element
            function renderColormap(mapIndex: number) {
                for (let colorIndex = 0; colorIndex < 256; colorIndex++) {
                    // Calculate position to draw
                    const column = (colorIndex % 16) * scaleX;
                    const row = (Math.floor(colorIndex / 16)) * scaleY;
                    // Set color and draw
                    const paletteIndex = colormap.getColor(mapIndex, colorIndex);
                    context.fillStyle = playpal.getColorHex(0, paletteIndex);
                    context.fillRect(column, row, scaleX, scaleY);
                }
            }
            // Create a view for browsing the palettes in the lump
            makeSequentialView({
                root: root,
                initialIndex: 0,
                getMaxIndex: () => colormap.getMapCount(),
                getPositionText: (index: number) => {
                    return `Colormap ${index + 1} of ${colormap.getMapCount()}`;
                },
                getDescriptionText: (index: number) => {
                    return lumps.WADColorMap.DoomColormapNames[index];
                },
                onReady: (container: HTMLElement, index: number) => {
                    container.appendChild(canvas);
                    renderColormap(index);
                },
                onChangeIndex: (index: number) => {
                    renderColormap(index);
                },
            });
        }
    });
}
