import * as map3D from "@src/convert/3DMapBuilder";
import {TextureSet, TextureLibrary} from "@src/lumps/textureLibrary";

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

export function ConvertMapToOBJ(
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
        wall = map3D.MapGeometryBuilder.recalculateMidtex(wall, objTextures[textureKey].height);
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
