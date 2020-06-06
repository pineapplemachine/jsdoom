import {Mappable} from "@src/convert/3DGeneral";
import * as map3D from "@src/convert/3DMapBuilder";
import {WADColorMap} from "@src/lumps/doom/colormap";
import {WADPalette} from "@src/lumps/doom/playpal";
import {TextureLibrary, TextureSet} from "@src/lumps/textureLibrary";
import {FetchableString} from "@web/fetchable";
import * as THREE from "three";

// The type of buffer to get the index of an element from
enum BufferType {
    Vertex,
    Normal,
    UV,
    Color,
    LightLevel,
}

// A "group" for rendering
interface ThreeGroup {
    // The name of the texture/material
    material: string;
    // The index of the starting element
    start: number;
    // The amount of elements this group has
    count: number;
}

// How to render the textures
export enum MaterialStyle {
    // Use "nearest neighbour" (pixelated) filtering
    Pixelated,
    // Use linear filtering
    Linear,
    // Emulate Doom planar software renderer
    DoomSoftware,
    // Emulate Nintendo 64 three-point bilinear filtering
    Doom64,
    // No textures
    Untextured,
    // Wireframe mode
    Wireframe,
}

const softwareVertexResource = new FetchableString(
    "/assets/shaders/softwareStyle.vert", {mode: "no-cors"});
const softwareFragmentResource = new FetchableString(
    "/assets/shaders/softwareStyle.frag", {mode: "no-cors"});
const basicVertexResource = new FetchableString(
    "/assets/shaders/basic.vert", {mode: "no-cors"});
const N64FragmentResource = new FetchableString(
    "/assets/shaders/threepoint.frag", {mode: "no-cors"});

class BufferModel {
    // Constants helpful when modifying buffers
    static readonly positionComponents: number = 3;
    static readonly normalComponents: number = 3;
    static readonly uvComponents: number = 2;
    static readonly colorComponents: number = 3;
    static readonly lightComponents: number = 1;
    static readonly mirrorComponents: number = 2;
    // The threshold which determines whether a pixel is (completely)
    // transparent or not
    static readonly alphaTest: number = .1;
    // Placeholder material in case the texture is not in the library
    static readonly nullMappable: Mappable = {
        width: 64,
        height: 64,
    };
    static readonly nullTexture: THREE.Texture = (() => {
        const loader = new THREE.TextureLoader();
        return loader.load("assets/textures/missing.png",
        (texture: THREE.Texture) => {
            texture.flipY = false;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearFilter;
        });
    })();
    static readonly nullMaterial = new THREE.MeshBasicMaterial({
        name: "-",
        map: BufferModel.nullTexture,
        vertexColors: true,
    });
    // The THREE.js buffer geometry
    protected geometry: THREE.BufferGeometry;
    // NOTE: Attributes are initialized in the constructor
    // The vertex buffer
    protected vertexBuffer: Float32Array;
    // The vertex normal buffer
    protected normalBuffer: Float32Array;
    // The uv coordinate buffer
    protected uvBuffer: Float32Array;
    // The vertex color buffer
    protected colorBuffer: Float32Array;
    // The sector light level for each vertex
    protected lightBuffer: Int32Array;
    // Whether or not to mirror the texture on this vertex
    protected mirrorBuffer: Uint8Array;
    // Current element indices for each buffer
    protected vertexElement: number;
    protected normalElement: number;
    protected uvElement: number;
    protected colorElement: number;
    protected lightElement: number;
    protected mirrorElement: number;
    // Array of THREE.js materials
    protected materials: THREE.Material[];
    // Array of THREE.js textures, for disposal
    protected textures: THREE.Texture[];
    // Mapping of names to material indices
    protected materialIndices: {[name: string]: number};
    // The texture library to use for getting the texture data
    protected library: TextureLibrary;
    // The texture to use for the palette and fade tables
    protected colourMapTexture: THREE.Texture;
    // The style to render the materials in
    public materialStyle: MaterialStyle;

    constructor(
        triangles: number,
        library: TextureLibrary,
        style: MaterialStyle = MaterialStyle.Linear
    ){
        // Constants
        const verticesPerTriangle = 3;
        const valuesPerTriangle = verticesPerTriangle * triangles;
        // Initialize buffer element index helpers
        this.vertexElement = 0;
        this.normalElement = 0;
        this.uvElement = 0;
        this.colorElement = 0;
        this.lightElement = 0;
        this.mirrorElement = 0;
        // Initialize the buffer and its attributes
        this.geometry = new THREE.BufferGeometry();
        this.vertexBuffer = new Float32Array(valuesPerTriangle * BufferModel.positionComponents);
        const vertexBufferAttribute = new THREE.BufferAttribute(this.vertexBuffer, BufferModel.positionComponents);
        this.normalBuffer = new Float32Array(valuesPerTriangle * BufferModel.normalComponents);
        const normalBufferAttribute = new THREE.BufferAttribute(this.normalBuffer, BufferModel.normalComponents);
        this.uvBuffer = new Float32Array(valuesPerTriangle * BufferModel.uvComponents);
        const uvBufferAttribute = new THREE.BufferAttribute(this.uvBuffer, BufferModel.uvComponents);
        this.colorBuffer = new Float32Array(valuesPerTriangle * BufferModel.colorComponents);
        const colorBufferAttribute = new THREE.BufferAttribute(this.colorBuffer, BufferModel.colorComponents);
        this.lightBuffer = new Int32Array(valuesPerTriangle * BufferModel.lightComponents);
        const lightBufferAttribute = new THREE.BufferAttribute(this.lightBuffer, BufferModel.lightComponents);
        this.mirrorBuffer = new Uint8Array(valuesPerTriangle * BufferModel.mirrorComponents);
        const mirrorBufferAttribute = new THREE.BufferAttribute(this.mirrorBuffer, BufferModel.mirrorComponents);
        this.geometry.setAttribute("position", vertexBufferAttribute);
        this.geometry.setAttribute("normal", normalBufferAttribute);
        this.geometry.setAttribute("uv", uvBufferAttribute);
        this.geometry.setAttribute("color", colorBufferAttribute);
        this.geometry.setAttribute("light", lightBufferAttribute);
        this.geometry.setAttribute("mirror", mirrorBufferAttribute);
        // Initialize material and texture arrays
        // The null material being the first is necessary because Lilywhite
        // Lilith MAP02 will use the wrong textures on flats otherwise.
        this.materials = style === MaterialStyle.Untextured ?
            [new THREE.MeshBasicMaterial({vertexColors: true})] :
            [BufferModel.nullMaterial];
        this.materialIndices = {"-": 0};
        this.textures = [];
        this.library = library;
        const colourMapBuffer = library.getColormaps();
        this.colourMapTexture = new THREE.DataTexture(
            colourMapBuffer,
            WADPalette.ColorsPerPalette,
            library.colormap.getMapCount(),
            THREE.RGBAFormat,
            THREE.UnsignedByteType,
            THREE.UVMapping,
            THREE.RepeatWrapping,
            THREE.RepeatWrapping,
            THREE.NearestFilter,
            THREE.NearestFilter,
            0
        );
        this.materialStyle = style;
    }

    // Create a material which uses a shader to render indexed textures in the
    // style of the Doom software renderer. Requires an additional colourmap
    // texture.
    private static createSoftwareStyleMaterial(
        // The name of the material
        name: string,
        // The texture, in palette index-alpha format
        texture: THREE.Texture,
        // Palette/colormap texture to use for the palette and fade table
        colormapTexture: THREE.Texture,
    ): THREE.ShaderMaterial {
        texture.generateMipmaps = false;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.needsUpdate = true;
        colormapTexture.generateMipmaps = false;
        colormapTexture.magFilter = THREE.NearestFilter;
        colormapTexture.minFilter = THREE.NearestFilter;
        colormapTexture.needsUpdate = true;
        const material = new THREE.ShaderMaterial({
            name,
            uniforms: {
                image: {value: texture},
                colours: {value: colormapTexture},
                maxColourmap: {value: 31},
                paletteInterpolation: {value: true},
            },
        });
        softwareVertexResource.onComplete.push((data) => {
            if(data != null){
                material.vertexShader = data;
                material.needsUpdate = true;
            }
        });
        softwareVertexResource.fetch(5);
        softwareFragmentResource.onComplete.push((data) => {
            if(data != null){
                material.fragmentShader = data;
                material.needsUpdate = true;
            }
        });
        softwareFragmentResource.fetch(5);
        return material;
    }
    
    // Create a material which renders true-colour and indexed textures in the
    // style of the Nintendo 64 (Doom 64)
    private static createDoom64Material(
        // The name of the material
        name: string,
        // The texture to use on the material
        texture: THREE.Texture,
    ): THREE.ShaderMaterial {
        const material = new THREE.ShaderMaterial({
            name,
            uniforms: {
                tex: {value: texture},
            },
        });
        basicVertexResource.onComplete.push((data) => {
            if(data != null){
                material.vertexShader = data;
                material.needsUpdate = true;
            }
        });
        basicVertexResource.fetch(5);
        N64FragmentResource.onComplete.push((data) => {
            if(data != null){
                material.fragmentShader = data;
                material.needsUpdate = true;
            }
        });
        N64FragmentResource.fetch(5);
        return material;
    }
    
    // Set an element of one of the buffers.
    private setBufferElementAt(buffer: BufferType, values: number[], elementIndex: number){
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
        }else if(buffer === BufferType.LightLevel){
            this.lightBuffer.set(values, elementIndex);
        }
    }

    // Set an element of one of the buffers, incrementing the buffer index in the process.
    private setBufferElement(buffer: BufferType, values: number[], increment: boolean = true){
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
        }else if(buffer === BufferType.LightLevel){
            if(values.length > 0){
                this.setBufferElementAt(buffer, values, this.lightElement);
                if(increment){
                    this.lightElement += values.length;
                }
            }
        }
    }

    // Get the material index for the given material. Return -1 if the material
    // is not in the materials array
    private getMaterialIndex(name: string): number {
        if(this.materialIndices[name] == null){
            return -1;
        }
        return this.materialIndices[name];
    }

    // Get the material index for the given material, or add it if it is not in
    // the material array. Return the index of the material in the material array.
    private getOrAddMaterial(name: string, material: THREE.Material): number {
        if(this.materialIndices[name] == null){
            this.materialIndices[name] = this.materials.length;
            this.materials.push(material);
        }
        return this.materialIndices[name];
    }

    // Get the material index for the given texture, adding it to the material
    // array if it hasn't already been added.
    protected getMaterialIndexFor(name: string, set: TextureSet, place?: map3D.LineQuadPlace): number {
        if(this.materialStyle === MaterialStyle.Untextured){
            return 0;
        }
        const materialIndex = this.getMaterialIndex(name);
        if(materialIndex >= 0){
            return materialIndex;
        }else{
            // Get texture data and make a THREE.js texture out of it
            const wadTexture = this.library.get(name, set);
            if(wadTexture != null){
                // Figure out a few things before creating the material
                const size = this.library.getSize(name, set);
                let magFilter = THREE.LinearFilter;
                if(this.materialStyle === MaterialStyle.Pixelated){
                    magFilter = THREE.NearestFilter;
                }
                const minFilter = THREE.LinearFilter;
                // Use indexed buffer if possible, will be null otherwise.
                const softwareStyleBuffer = (
                    this.materialStyle === MaterialStyle.DoomSoftware ?
                    this.library.getIndexed(name, set) : null);
                const format = (
                    softwareStyleBuffer != null ?
                    THREE.RGBFormat : THREE.RGBAFormat);
                const buffer = (
                    softwareStyleBuffer != null ?
                    softwareStyleBuffer :
                    this.library.getRgba(name, set)!);
                const anisotropy = (
                    softwareStyleBuffer != null ? 0 : 4);
                const texture = new THREE.DataTexture(
                    buffer, // Buffer
                    size.width, // Width
                    size.height, // Height
                    format, // Texture format
                    THREE.UnsignedByteType, // Data type
                    THREE.UVMapping, // Mapping
                    THREE.RepeatWrapping, // X (S) wrapping
                    THREE.RepeatWrapping, // Y (T) wrapping
                    magFilter, // Upscale filter
                    minFilter, // Downscale filter
                    anisotropy // Anisotropy
                );
                // Is the texture transparent?
                const transparent = (place == null) ? false : (
                    // Only midtextures can be transparent
                    place === map3D.LineQuadPlace.Midtexture &&
                    this.library.isTransparent(name, set)
                );
                const material = (() => {
                    if(softwareStyleBuffer != null){
                        return BufferModel.createSoftwareStyleMaterial(
                            name, texture, this.colourMapTexture);
                    }else if(this.materialStyle === MaterialStyle.Doom64){
                        return BufferModel.createDoom64Material(name, texture);
                    }
                    return new THREE.MeshBasicMaterial({
                        name,
                        map: texture,
                        wireframe: this.materialStyle === MaterialStyle.Wireframe,
                    });
                })();
                material.transparent = transparent;
                material.alphaTest = transparent ? BufferModel.alphaTest : 0;
                material.vertexColors = true;
                material.needsUpdate = true;
                this.textures.push(texture);
                return this.getOrAddMaterial(name, material);
            }
        }
        return this.getOrAddMaterial(name, BufferModel.nullMaterial);
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
        this.colourMapTexture.dispose();
    }

    // Add a quad to the buffer.
    addQuad(quad: map3D.LineQuad){
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
        const materialIndex: number = this.getMaterialIndexFor(quad.texture, quad.textureSet, quad.place);
        const textureSize: Mappable = this.library.getSize(quad.texture, quad.textureSet);
        quad = map3D.MapGeometryBuilder.recalculateMidtex(quad, textureSize.height);
        const wallAngle = ((reverse: boolean) => {
            const wallAngle = Math.atan2(
                (quad.startY - quad.endY) / quad.width,
                (quad.startX - quad.endX) / quad.width);
            return reverse ? wallAngle + Math.PI / 2 : wallAngle - Math.PI / 2;
        })(quad.reverse);
        // Fake contrast value to add to vertex colour
        const fakeContrast = ((wallAngle) => {
            // From the Chocolate Doom source code:
            // if (curline->v1->y == curline->v2->y)
            // lightnum--;
            // else if (curline->v1->x == curline->v2->x)
            // lightnum++;
            // Lightnum refers to the colormap index. A higher colormap
            // index is darker, and a lower colormap index is brighter.
            if(wallAngle === (-Math.PI / 2)){
                // Horizontal; make it brighter
                return 0.0625;
            }else if(wallAngle === (Math.PI / 2)){
                return 0.0625;
            }else if(wallAngle === 0){
                // Vertical; make it darker
                return -0.0625;
            }else if(wallAngle === Math.PI){
                return -0.0625;
            }
            return 0;
        })(wallAngle);
        for(let vertexIterIndex = 0; vertexIterIndex < quadTriVertices.length; vertexIterIndex++){
            const quadTriVertex = (
                !quad.reverse ?
                quadTriVertices[vertexIterIndex] :
                quadTriVertices[quadTriVertices.length - vertexIterIndex - 1]);
            const lightLevel = quad.lightLevel;
            const lightGray = lightLevel / 255;
            this.setBufferElement(BufferType.Vertex, xyzFor(quadTriVertex));
            this.setBufferElement(BufferType.Normal, [Math.cos(wallAngle), 0, Math.sin(wallAngle)]);
            this.setBufferElement(BufferType.UV, map3D.MapGeometryBuilder.getQuadUVs(textureSize, quadTriVertex, quad));
            this.setBufferElement(BufferType.Color, [lightGray + fakeContrast, lightGray + fakeContrast, lightGray + fakeContrast]);
            this.setBufferElement(BufferType.LightLevel, [lightLevel]);
        }
        return materialIndex;
    }

    // Add a sector triangle to the buffer.
    addTriangle(triangle: map3D.SectorTriangle){
        const textureSize = this.library.getSize(triangle.texture, triangle.textureSet);
        const materialIndex: number = this.getMaterialIndexFor(triangle.texture, triangle.textureSet);
        for(let vertexIterIndex = 0; vertexIterIndex < triangle.vertices.length; vertexIterIndex++){
            const vertexIndex = !triangle.reverse ? vertexIterIndex : triangle.vertices.length - vertexIterIndex - 1;
            const vertex = triangle.vertices[vertexIndex];
            const [x, y, z] = [vertex.x, triangle.height, vertex.y];
            const lightLevel = triangle.lightLevel;
            const lightGray = lightLevel / 255;
            this.setBufferElement(BufferType.Vertex, [x, y, z]);
            this.setBufferElement(BufferType.Normal, [
                triangle.normalVector.x,
                triangle.normalVector.y,
                triangle.normalVector.z,
            ]);
            this.setBufferElement(BufferType.UV, map3D.MapGeometryBuilder.getSectorVertexUVs(vertex, textureSize));
            this.setBufferElement(BufferType.Color, [lightGray, lightGray, lightGray]);
            this.setBufferElement(BufferType.LightLevel, [lightLevel]);
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

// Options for converting a map to THREE.js format
export interface ConvertOptions {
    // The rendering style to use
    style?: MaterialStyle;
    // Whether or not to use textures. Turning this off can provide a huge
    // performance boost.
    textured?: boolean;
}

export function ConvertMapToThree(
    map: map3D.MapGeometry,
    textureLibrary: TextureLibrary,
    options?: ConvertOptions
): DisposableGroup {
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
    const wallModel: BufferModel = new BufferModel(wallQuads.length * 2, textureLibrary);
    const midModel: BufferModel = new BufferModel(midQuads.length * 2, textureLibrary);
    const flatModel: BufferModel = new BufferModel(map.sectorTriangles.length, textureLibrary);
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
        flatModel.addTriangle(triangle);
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
        wallModel.addQuad(wall);
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
        midModel.addQuad(wall);
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
