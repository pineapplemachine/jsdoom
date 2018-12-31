import * as THREE from "three";

import {MapGeometryBuilder} from "@src/convert/3DMapBuilder";
import {KeyboardListener} from "./keyboardListener";

import * as lumps from "@src/lumps/index";
import {WADFile} from "@src/wad/file";
import {WADFileList} from "@src/wad/fileList";
import {WADLump} from "@src/wad/lump";

import {TextureLibrary} from "@src/lumps/index";

import {getPng64, bufferbtoa} from "@web/png64";
import * as util from "@web/util";

const win: any = window as any;

let lastWadFile: WADFile | null = null;
let wadFileList: WADFileList;

// Get WAD file list
// Makes this file easier to maintain when the proper implementation is added
function getWadFileList(lump: WADLump): WADFileList {
    if(lump.file !== lastWadFile){
        lastWadFile = lump.file;
        wadFileList = new WADFileList([lump.file as WADFile]);
    }
    return wadFileList;
}

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
        const files: WADFileList = getWadFileList(lump);
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
        const files: WADFileList = getWadFileList(lump);
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
        const files: WADFileList = getWadFileList(lump);
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

interface Map3DOptions {
    // The vertical FOV to use
    fov?: number;
}

export const LumpTypeViewMap3D = function(
    options: Map3DOptions
): LumpTypeView {
    const fov: number = options.fov || 90;
    return new LumpTypeView({
        name: "Map (3D)",
        icon: "assets/icons/lump-map.png",
        view: (lump: WADLump, root: HTMLElement) => {
            const mapLump: (WADLump | null) = lumps.WADMap.findMarker(lump);
            if(!mapLump){
                return;
            }
            const map = lumps.WADMap.from(mapLump);
            const textureLibrary = new TextureLibrary(getWadFileList(mapLump));
            const canvas = util.createElement({
                tag: "canvas",
                class: "lump-view-map-geometry",
                appendTo: root,
            });
            const scene = new THREE.Scene();
            const renderer = new THREE.WebGLRenderer({canvas, alpha: true});
            renderer.setSize(root.clientWidth, root.clientHeight);
            const camera = new THREE.PerspectiveCamera(fov, root.clientWidth / root.clientHeight, 1, 10000);
            const playerStart = map.getPlayerStart(1);
            const playerAngle = playerStart ? playerStart.angle / (180 / Math.PI) : 0;
            camera.position.set(playerStart ? playerStart.x : 0, 0, playerStart ? -playerStart.y : 0);
            camera.rotation.y = playerAngle;
            const directionSphere = new THREE.Spherical(1, 90 / (180 / Math.PI), playerAngle);
            const mapBuilder = new MapGeometryBuilder(map, textureLibrary);
            const mesh = mapBuilder.rebuild();
            if(mesh != null){
                const vnh = new THREE.VertexNormalsHelper(mesh, 5, 0x3884fa, 2);
                scene.add(mesh);
                scene.add(vnh);
            }
            const controls = new KeyboardListener();
            const render = () => {
                if(controls.keyState["ArrowUp"]){
                    directionSphere.phi -= 2 / (180 / Math.PI);
                }
                if(controls.keyState["ArrowDown"]){
                    directionSphere.phi += 2 / (180 / Math.PI);
                }
                if(controls.keyState["ArrowLeft"]){
                    directionSphere.theta += 2 / (180 / Math.PI);
                }
                if(controls.keyState["ArrowRight"]){
                    directionSphere.theta -= 2 / (180 / Math.PI);
                }
                if(controls.keyState["w"]){
                    camera.translateZ(-10);
                }
                if(controls.keyState["s"]){
                    camera.translateZ(10);
                }
                if(controls.keyState["a"]){
                    camera.translateX(-10);
                }
                if(controls.keyState["d"]){
                    camera.translateX(10);
                }
                directionSphere.makeSafe();
                const lookAtMe = new THREE.Vector3();
                lookAtMe.setFromSpherical(directionSphere).add(camera.position);
                camera.lookAt(lookAtMe);
                camera.updateProjectionMatrix();
                renderer.render(scene, camera);
            };
            setInterval(() => requestAnimationFrame(render), (1 / 35) * 1000);
        },
        clear: (lump: WADLump, root: HTMLElement) => {
            //
        }
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
            const files = getWadFileList(lump);
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
            const files = getWadFileList(lump);
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
