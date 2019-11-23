import * as map3D from "@src/convert/3DMapBuilder";
import * as THREE from "three";

import {TextureLibrary} from "@src/lumps/textureLibrary";

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
        quad = map3D.MapGeometryBuilder.recalculateMidtex(quad, texture.height);
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

export function ConvertMapToThree(map: map3D.MapGeometry, textureLibrary: TextureLibrary): DisposableGroup {
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
