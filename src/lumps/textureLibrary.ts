import {WADFlat} from "@src/lumps/doom/flat";
import {WADTexture, WADTextures} from "@src/lumps/doom/textures";
import {WADFileList} from "@src/wad/fileList";
import {WADLump} from "@src/wad/lump";

// Flats and walls use different texture sets.
export enum TextureSet {
    Walls,
    Flats,
}

export class TextureLibrary {
    // The textures themselves
    protected textures: {
        [TextureSet.Walls]: {[name: string]: WADTexture | null};
        [TextureSet.Flats]: {[name: string]: WADFlat | null};
    };
    // And whether or not each one is transparent
    protected transparent: {
        [TextureSet.Walls]: {[name: string]: boolean | null};
        [TextureSet.Flats]: {[name: string]: boolean | null};
    };
    // RGBA pixel buffers created from each texture
    protected rgba: {
        [TextureSet.Walls]: {[name: string]: Buffer | null};
        [TextureSet.Flats]: {[name: string]: Buffer | null};
    };
    public fileList: WADFileList;
    constructor(fileList: WADFileList){
        this.fileList = fileList;
        this.textures = {
            [TextureSet.Walls]: {},
            [TextureSet.Flats]: {},
        };
        this.transparent = {
            [TextureSet.Walls]: {},
            [TextureSet.Flats]: {},
        };
        this.rgba = {
            [TextureSet.Walls]: {},
            [TextureSet.Flats]: {},
        };
    }
    protected isFlatMarker(lump: WADLump): boolean {
        const name = lump.name;
        return (
            name === "F1_START" || name === "F2_START" || name === "F3_START" ||
            name === "F1_END" || name === "F2_END" || name === "F3_END" ||
            lump.dataLength === 0
        );
    }
    get(name: string, set: TextureSet): WADTexture | WADFlat | null {
        // Get a texture, or add it to the library if it has not already been added
        // Already indexed, so return it immediately
        if(this.textures[set][name] !== undefined){
            // A texture could missing from the texture lists and flat collections.
            console.log(`Using cached ${TextureSet[set]}[${name}]`);
            return this.textures[set][name];
        }
        console.log(`${TextureSet[set]}[${name}] is not in the library.`);
        // Wall textures are defined in TEXTUREx list entries
        if(set === TextureSet.Walls){
            for(let textureListIndex = 1; textureListIndex <= 3; textureListIndex++){
                const listName = `TEXTURE${textureListIndex}`;
                const listLump = this.fileList.map.get(listName);
                if(listLump){
                    const texList = WADTextures.from(listLump);
                    const texture = texList.getTextureByName(name);
                    if(texture){
                        this.textures[set][name] = texture;
                        this.transparent[set][name] = texture.isTransparent(this.fileList);
                        this.rgba[set][name] = texture.getPixelDataRGBA(this.fileList);
                        return texture;
                    }
                }
            }
        }else if(set === TextureSet.Flats){
            // Search IWAD flats
            const flatsStart = this.fileList.map.get("F_START");
            if(flatsStart){
                for(const flatLump of flatsStart.enumerateNextLumps()){
                    if(flatLump.name === "F_END" || flatLump.name === "FF_END"){
                        break;
                    }
                    if(this.isFlatMarker(flatLump)){
                        continue;
                    }
                    const flat = WADFlat.from(flatLump);
                    this.textures[set][name] = WADFlat.from(flatLump);
                    this.transparent[set][name] = false;
                    this.rgba[set][name] = flat.getPixelDataRGBA(this.fileList.getColors());
                    if(flatLump.name === name){
                        return this.textures[set][name];
                    }
                }
            }
            // Not found, search custom flats
            const flatsStarts = this.fileList.map.getAll("FF_START");
            if(flatsStarts){
                for(const customFlatStart of flatsStarts){
                    for(const flatLump of customFlatStart.enumerateNextLumps()){
                        if(flatLump.name === "F_END" || flatLump.name === "FF_END"){
                            break;
                        }
                        if(this.isFlatMarker(flatLump)){
                            continue;
                        }
                        const flat = WADFlat.from(flatLump);
                        this.textures[set][name] = flat;
                        this.transparent[set][name] = false;
                        this.rgba[set][name] = flat.getPixelDataRGBA(this.fileList.getColors());
                        if(flatLump.name === name){
                            return this.textures[set][name];
                        }
                    }
                }
            }
        }
        this.textures[set][name] = null;
        this.transparent[set][name] = null;
        this.rgba[set][name] = null;
        return null;
    }
    isTransparent(name: string, set: TextureSet){
        // This value is set when the texture is added, and this method is
        // usually called after a texture is added.
        return this.transparent[set][name] || false;
    }
    getRgba(name: string, set: TextureSet): Buffer | null {
        // The RGBA data is cached when a texture is added.
        return this.rgba[set][name] || null;
    }
}

export default TextureLibrary;
