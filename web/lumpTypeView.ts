import * as THREE from "three";
import {DeviceOrientationControls} from "three/examples/jsm/controls/DeviceOrientationControls.js";
import {WEBVR} from "three/examples/jsm/vr/WebVR.js";

// Fullscreen support
import fscreen from "fscreen";

// 2D view stuff
import {drawMapGeometry} from "@web/views/2d/2dview";
import {MapGeometryOptions} from "@web/views/2d/options";

// 3D view related stuff
import * as map3D from "@src/convert/3DMapBuilder";
import {ConvertMapToGeometry} from "@web/views/3d/base";
import {ConvertMapToMTL} from "@web/views/3d/mtl";
import {ConvertMapToOBJ} from "@web/views/3d/obj";
import {ConvertMapToThree} from "@web/views/3d/three";
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

export {LumpTypeViewMapGeometry} from "@web/views/2d/view";

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
    // Mouse controls that manipulate a THREE.Spherical
    let mouseController: ((event: MouseEvent) => void) | null = null;
    const makeMouseController = (direction: THREE.Spherical): (event: MouseEvent) => void => {
        mouseController = (event: MouseEvent) => {
            direction.theta -= event.movementX / (180 / Math.PI);
            direction.phi -= event.movementY / (180 / Math.PI);
            direction.makeSafe();
        };
        return mouseController;
    };
    // Handle mouse movement when pointer is locked
    let hasPointerLock = false;
    const handleLockedPointer = () => {
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
    // Ensure any event handlers can be unbound in clear()
    let handleResize: () => void = () => {};
    let handleFullscreen: () => void = () => {};
    let handleTouchStart: () => void = () => {};
    let handleTouchEnd: () => void = () => {};
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
            if(!map){
                createError(`Lump ${mapLump.name} is not a map!`, root);
                return null;
            }
            // Map is valid, convert it to geometry
            let convertedMap: map3D.MapGeometry | null = null;
            try{
                convertedMap = ConvertMapToGeometry(lump);
            }catch(error){
                createError(`Could not get map geometry: ${error}`, root);
                return null;
            }
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
            document.addEventListener("pointerlockchange", handleLockedPointer);
            // WebVR/WebXR supported?
            const vrSupported = "xr" in navigator || "getVRDisplays" in navigator;
            let context: WebGLRenderingContext | undefined = undefined;
            // Prefer WebGL2 context, since that allows non-power-of-2 textures
            // to tile. If this fails, THREE.js will create its own context.
            context = canvas.getContext("webgl2", {
                alpha: true,
                antialias: false,
                powerPreference: "high-performance",
                depth: true,
                // Needed for WebXR support, otherwise you get InvalidStateErrors
                xrCompatible: vrSupported,
            });
            // Now that the map geometry has been converted, convert it to a
            // model that can be used by THREE.js.
            const meshGroup = ConvertMapToThree(
                convertedMap!,
                sharedDataManager.getTextureLibrary(lump),
            );
            // Initialize scene, renderer, and camera
            const scene = new THREE.Scene();
            disposables.push(scene);
            scene.add(meshGroup.group);
            disposables.push(meshGroup);
            const renderer = new THREE.WebGLRenderer({canvas, context});
            renderer.setSize(root.clientWidth, root.clientHeight, false);
            renderer.setPixelRatio(window.devicePixelRatio);
            // Allow VR
            if(vrSupported){
                renderer.vr.enabled = true;
                // VR is supported
                const vrButton = WEBVR.createButton(renderer);
                root.appendChild(vrButton);
            }else{
                // Allow 3D view to be expanded to full screen
                const fullscreenButton = util.createElement({
                    tag: "div",
                    class: "fullscreen-button",
                    content: "\u26F6",
                    onleftclick: () => {
                        fscreen.requestFullscreen(canvas);
                    },
                    appendTo: root,
                });
                root.appendChild(fullscreenButton);
            }
            disposables.push(renderer);
            // VR controls
            const controller = renderer.vr.getController(0);
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
            // Set up controls
            // Detect devices that have a built-in compass and/or accelerometer
            let orientableDevice = false;
            if(window.DeviceOrientationEvent && "ontouchstart" in window){
                // Thanks to https://stackoverflow.com/a/22097717
                orientableDevice = true;
            }
            const controls: (KeyboardListener | DeviceOrientationControls) = (
                orientableDevice ? new DeviceOrientationControls(camera) :
                new KeyboardListener());
            // Handle touches
            handleTouchStart = () => {
                viewHeadMoving = true;
            };
            handleTouchEnd = () => {
                viewHeadMoving = false;
            };
            window.addEventListener("touchstart", handleTouchStart);
            window.addEventListener("touchend", handleTouchEnd);
            // Luckily, both KeyboardListener and DeviceOrientationControls have
            // dispose methods
            disposables.push(controls);
            // Bind resize and fullscreen event handler
            handleResize = () => {
                camera.aspect = root.clientWidth / root.clientHeight;
                renderer.setSize(root.clientWidth, root.clientHeight, false);
                renderer.setPixelRatio(window.devicePixelRatio);
                camera.updateProjectionMatrix();
            };
            handleFullscreen = () => {
                if(fscreen.fullscreenElement){
                    const sceneWidth = window.outerWidth;
                    const sceneHeight = window.outerHeight;
                    camera.aspect = sceneWidth / sceneHeight;
                    renderer.setSize(sceneWidth, sceneHeight, false);
                    renderer.setPixelRatio(window.devicePixelRatio);
                    camera.updateProjectionMatrix();
                }else{
                    handleResize();
                }
            };
            window.addEventListener("resize", handleResize);
            fscreen.addEventListener("fullscreenchange", handleFullscreen);
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
            const moveDistance = 7; // Distance to move camera
            const render = () => {
                // Movement in VR
                if(renderer.vr.isPresenting()){
                    // Reset viewHead rotation
                    viewHead.setRotationFromQuaternion(new THREE.Quaternion());
                    if(viewHeadMoving){
                        const destination = new THREE.Vector3(0, 0, 1);
                        destination.applyQuaternion(renderer.vr.getCamera(camera).quaternion);
                        viewHead.translateOnAxis(destination, -moveDistance);
                    }
                }else if(orientableDevice){
                    const touchControls = controls as DeviceOrientationControls;
                    viewHead.setRotationFromQuaternion(new THREE.Quaternion());
                    touchControls.update();
                    if(viewHeadMoving){
                        const destination = new THREE.Vector3(0, 0, 1);
                        destination.applyQuaternion(camera.quaternion);
                        viewHead.translateOnAxis(destination, -moveDistance);
                    }
                }else{
                    const keyboardControls = controls as KeyboardListener;
                    // WASD controls - moves camera around
                    if(keyboardControls.keyState["w"]){
                        viewHead.translateZ(-moveDistance); // Forward
                    }
                    if(keyboardControls.keyState["s"]){
                        viewHead.translateZ(moveDistance); // Backward
                    }
                    if(keyboardControls.keyState["a"]){
                        viewHead.translateX(-moveDistance); // Left
                    }
                    if(keyboardControls.keyState["d"]){
                        viewHead.translateX(moveDistance); // Right
                    }
                    // Set view head direction (for non-VR users)
                    const lookAtMe = new THREE.Vector3();
                    lookAtMe.setFromSpherical(directionSphere).add(viewHead.position);
                    viewHead.lookAt(lookAtMe);
                }
                // Render
                renderer.render(scene, camera);
            };
            renderer.setAnimationLoop(render); // Needed for VR support
        },
        clear: () => {
            window.removeEventListener("resize", handleResize);
            fscreen.removeEventListener("fullscreenchange", handleFullscreen);
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
            window.removeEventListener("pointerlockchange", handleLockedPointer);
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
