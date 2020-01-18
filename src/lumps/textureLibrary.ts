import {WADFlat} from "@src/lumps/doom/flat";
import {WADTexture, WADTextures} from "@src/lumps/doom/textures";
import {WADFileList} from "@src/wad/fileList";
import {WADLump, WADCategory} from "@src/wad/lump";

// Flats and walls use different texture sets.
export enum TextureSet {
    Walls,
    Flats,
}

export function isWadTexture(texture: (WADTexture | WADFlat), set: TextureSet): texture is WADTexture {
    return set === TextureSet.Walls;
}
export function isWadFlat(texture: (WADTexture | WADFlat), set: TextureSet): texture is WADFlat {
    return set === TextureSet.Flats;
}

export class TextureLibrary {
    // The textures themselves
    protected textures: {
        [TextureSet.Walls]: {[name: string]: (WADTexture | null)};
        [TextureSet.Flats]: {[name: string]: (WADFlat | null)};
    };
    // And whether or not each one is transparent
    protected transparent: {
        [TextureSet.Walls]: {[name: string]: (boolean | null)};
        [TextureSet.Flats]: {[name: string]: (boolean | null)};
    };
    // RGBA pixel buffers created from each texture
    protected rgba: {
        [TextureSet.Walls]: {[name: string]: (Buffer | null)};
        [TextureSet.Flats]: {[name: string]: (Buffer | null)};
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
    
    // Get a texture, or add it to the library if it has not already been added
    get(name: string, set: TextureSet): (WADTexture | WADFlat | null) {
        // DOOM2.WAD has some walls where the texture name is lowercase
        const upperCaseName = name.toUpperCase();
        // Already indexed, so return it immediately
        if(this.textures[set][upperCaseName] !== undefined){
            // A texture could missing from the texture lists and flat collections.
            console.log(`Using cached ${TextureSet[set]}[${upperCaseName}]`);
            return this.textures[set][upperCaseName];
        }
        console.log(`${TextureSet[set]}[${upperCaseName}] is not in the library.`);
        // Wall textures are defined in TEXTUREx list entries
        if(set === TextureSet.Walls){
            for(let textureListIndex = 1; textureListIndex <= 3; textureListIndex++){
                const listName = `TEXTURE${textureListIndex}`;
                const listLump = this.fileList.map.get(listName);
                if(listLump){
                    const texList = WADTextures.from(listLump);
                    const texture = texList.getTextureByName(upperCaseName);
                    if(texture){
                        this.textures[set][upperCaseName] = texture;
                        // this.transparent[set][upperCaseName] = texture.isTransparent(this.fileList);
                        // this.rgba[set][upperCaseName] = texture.getPixelDataRGBA(this.fileList);
                        return texture;
                    }
                }
            }
        }else if(set === TextureSet.Flats){
            // Get lump
            const lump = this.fileList.map.get(upperCaseName, WADCategory.Flats);
            // Try to make a flat out of it
            // But set the library entry to null in case it doesn't exist
            this.textures[set][upperCaseName] = null;
            try{
                if(lump != null){
                    const flat = WADFlat.from(lump);
                    this.textures[set][upperCaseName] = flat;
                }else{
                    console.error("Lump is null");
                }
            }catch(error){
                console.error(`Could not add ${TextureSet[set]}[${upperCaseName}]:`, error);
            }
            return this.textures[set][upperCaseName];
        }
        this.textures[set][upperCaseName] = null;
        this.transparent[set][upperCaseName] = null;
        this.rgba[set][upperCaseName] = null;
        return null;
    }
    
    // Lazily get whether or not the texture is transparent
    isTransparent(name: string, set: TextureSet): boolean {
        // DOOM2.WAD has some walls where the texture name is lowercase
        const upperCaseName = name.toUpperCase();
        if(this.transparent[set][upperCaseName]){
            return this.transparent[set][upperCaseName]!;
        }
        this.transparent[set][upperCaseName] = false;
        const texture = this.textures[set][upperCaseName];
        if(texture && isWadTexture(texture, set)){
            const rgbaData = texture.getPixelDataRGBA(this.fileList);
            this.rgba[set][upperCaseName] = rgbaData;
            for(let alphaOffset = 3; alphaOffset < rgbaData.length; alphaOffset += 4){
                const alpha = rgbaData.readInt8(alphaOffset);
                if(alpha < 255){
                    this.transparent[set][upperCaseName] = true;
                    break;
                }
            }
        }
        // Flats cannot be transparent
        return this.transparent[set][name] || false;
    }
    
    // Lazily get the RGBA data for a texture
    getRgba(name: string, set: TextureSet): Buffer | null {
        const upperCaseName = name.toUpperCase();
        if(this.rgba[set][upperCaseName]){
            return this.rgba[set][upperCaseName];
        }
        const texture = this.textures[set][upperCaseName];
        if(texture && isWadTexture(texture, set)){
            this.rgba[set][upperCaseName] = texture.getPixelDataRGBA(this.fileList);
            return this.rgba[set][upperCaseName];
        }else if(texture && isWadFlat(texture, set)){
            this.rgba[set][upperCaseName] = texture.getPixelDataRGBA(this.fileList.getColors());
            return this.rgba[set][upperCaseName];
        }
        return null;
    }
}

export default TextureLibrary;
