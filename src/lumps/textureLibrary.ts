import {WADFlat} from "@src/lumps/doom/flat";
import {WADTexture, WADTextures} from "@src/lumps/doom/textures";
import {WADFileList} from "@src/wad/fileList";
import {WADLump} from "@src/wad/lump";

// Flats and walls use different texture sets.
export enum TextureSet {
    Walls,
    Flats,
}

export function isWadTexture(texture: WADTexture | WADFlat, set: TextureSet): texture is WADTexture {
    return set === TextureSet.Walls;
}
export function isWadFlat(texture: WADTexture | WADFlat, set: TextureSet): texture is WADFlat {
    return set === TextureSet.Flats;
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
        return WADFlat.IWADMarkerNames.includes(name) ||
            WADFlat.PWADMarkerNames.includes(name) ||
            lump.dataLength === 0;
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
                        // this.transparent[set][name] = texture.isTransparent(this.fileList);
                        // this.rgba[set][name] = texture.getPixelDataRGBA(this.fileList);
                        return texture;
                    }
                }
            }
        }else if(set === TextureSet.Flats){
            // Search IWAD flats
            const flatsStart = this.fileList.map.get(WADFlat.IWADMarkerStart);
            if(flatsStart){
                for(const flatLump of flatsStart.enumerateNextLumps()){
                    if(flatLump.name === WADFlat.IWADMarkerEnd){
                        break;
                    }
                    if(this.isFlatMarker(flatLump)){
                        continue;
                    }
                    let flat: WADFlat | null = null;
                    try{
                        flat = WADFlat.from(flatLump);
                        this.textures[set][name] = flat;
                    }catch(err){
                        console.error(flatLump.name, err);
                    }
                    // this.transparent[set][name] = false;
                    // this.rgba[set][name] = flat.getPixelDataRGBA(this.fileList.getColors());
                    if(flatLump.name === name){
                        return this.textures[set][name];
                    }
                }
            }
            // Not found, search custom flats
            const flatsStarts = this.fileList.map.getAll(WADFlat.PWADMarkerStart);
            if(flatsStarts){
                for(const customFlatStart of flatsStarts){
                    for(const flatLump of customFlatStart.enumerateNextLumps()){
                        if(flatLump.name === WADFlat.IWADMarkerEnd ||
                                flatLump.name === WADFlat.PWADMarkerEnd){
                            break;
                        }
                        if(this.isFlatMarker(flatLump)){
                            continue;
                        }
                        let flat: WADFlat | null = null;
                        try{
                            flat = WADFlat.from(flatLump);
                            this.textures[set][name] = flat;
                        }catch(err){
                            console.error(flatLump.name, err);
                        }
                        // this.transparent[set][name] = false;
                        // this.rgba[set][name] = flat.getPixelDataRGBA(this.fileList.getColors());
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
    isTransparent(name: string, set: TextureSet): boolean {
        // Lazily get whether or not the texture is transparent
        if(this.transparent[set][name]){
            return this.transparent[set][name]!;
        }
        this.transparent[set][name] = false;
        const texture = this.textures[set][name];
        if(texture && isWadTexture(texture, set)){
            const rgbaData = texture.getPixelDataRGBA(this.fileList);
            this.rgba[set][name] = rgbaData;
            for(let alphaOffset = 3; alphaOffset < rgbaData.length; alphaOffset += 4){
                const alpha = rgbaData.readInt8(alphaOffset);
                if(alpha < 255){
                    this.transparent[set][name] = true;
                    break;
                }
            }
        }
        // Flats cannot be transparent
        return this.transparent[set][name] || false;
    }
    getRgba(name: string, set: TextureSet): Buffer | null {
        // Lazily get the RGBA data for a texture
        if(this.rgba[set][name]){
            return this.rgba[set][name];
        }
        const texture = this.textures[set][name];
        if(texture && isWadTexture(texture, set)){
            this.rgba[set][name] = texture.getPixelDataRGBA(this.fileList);
            return this.rgba[set][name];
        }else if(texture && isWadFlat(texture, set)){
            this.rgba[set][name] = texture.getPixelDataRGBA(this.fileList.getColors());
            return this.rgba[set][name];
        }
        return null;
    }
}

export default TextureLibrary;
