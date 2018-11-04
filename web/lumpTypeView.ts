import {WADFile} from "@src/wad/file";
import {WADFileList} from "@src/wad/fileList";
import {WADLump} from "@src/wad/lump";
import * as lumps from "@src/lumps/index";

import {getPng64, bufferbtoa} from "@web/png64";
import * as util from "@web/util";

const win: any = window as any;

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
                    let byteString: string = byte.toString(16);
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
        const files: WADFileList = new WADFileList([<WADFile> lump.file]);
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
        const files: WADFileList = new WADFileList([<WADFile> lump.file]);
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
        const files: WADFileList = new WADFileList([<WADFile> lump.file]);
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
    drawVertexes?: boolean,
    // Draw lines for each linedef
    drawLines?: boolean,
    // Draw circles for each thing
    drawThings?: boolean,
    // Leave at least this many pixels of blank space between the map
    // geometry and the canvas border. (Defaults to 50px)
    margin?: number,
};

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

export function LumpTypeViewPlaypal(scaleX:number = 4, scaleY:number = 4) {
    return new LumpTypeView({
        name: "Playpal",
        icon: "assets/icons/lump-playpal.png",
        view: (lump: WADLump, root: HTMLElement) => {
            // 2 containers are needed in order to center the inner container
            const container2 = util.createElement({
                class: "lump-view-playpal",
                appendTo: root
            });
            const container = util.createElement({
                class: "lump-view-playpal-inner",
                appendTo: container2
            });

            const playpal = lumps.WADPalette.from(lump);
            const numPals = playpal.getPaletteCount();
            let curPal = 0; // Current palette index

            // Arrow buttons to navigate between palettes
            const nextArrow = util.createElement({
                content: "»",
                class: "lump-view-playpal-navbtn",
                onleftclick: () => {
                    curPal += 1;
                    if (curPal >= numPals) {
                        curPal = 0;
                    }
                    drawPalette(curPal);
                }
            });
            const prevArrow = util.createElement({
                content: "«",
                class: "lump-view-playpal-navbtn",
                onleftclick: () => {
                    curPal -= 1;
                    if (curPal < 0) {
                        curPal = numPals - 1;
                    }
                    drawPalette(curPal);
                }
            });

            // Width and height of palette canvas
            const displayWidth = 16 * scaleX;
            const displayHeight = 16 * scaleY;

            // Construct view
            // Palette number display
            const palNumEl = util.createElement({
                content: `${curPal+1}/${numPals}`,
                appendTo: container
            });
            // Palette canvas
            const palCanvas = util.createElement({
                tag: "canvas",
                appendTo: container
            });
            // Palette navigator
            util.createElement({
                content: [prevArrow, nextArrow],
                class: "lump-view-playpal-nav",
                appendTo: container
            });
            palCanvas.width = displayWidth;
            palCanvas.height = displayHeight;

            // Draw palette to palCanvas
            function drawPalette(palNum: number) {
                if (!lump.data) {
                    return;
                }

                const context = palCanvas.getContext("2d") as CanvasRenderingContext2D;
                for (let palIdx = 0; palIdx < 256; palIdx++) {

                    // Set RGB components
                    const rgb = playpal.getColorBGRA(palNum, palIdx);

                    // Calculate position to draw
                    const column = palIdx % 16;
                    const row = Math.floor(palIdx / 16);

                    // Set colour and draw
                    // Convert to hexadecimal string and trim alpha - HTML/CSS colours are in #RRGGBB format
                    context.fillStyle = `#${rgb.toString(16).substring(2)}`;
                    context.fillRect(
                        column * scaleX,
                        row * scaleY,
                        scaleX, scaleY
                    );

                    // Update palette number display
                    palNumEl.innerText = `${curPal+1}/${numPals}`;
                }
            }
            drawPalette(curPal);
        }
    });
}
