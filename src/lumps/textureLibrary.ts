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
        [TextureSet.Walls]: {[name: string]: WADTexture};
        [TextureSet.Flats]: {[name: string]: WADFlat};
    };
    // And whether or not each one is transparent
    protected transparent: {
        [TextureSet.Walls]: {[name: string]: boolean};
        [TextureSet.Flats]: {[name: string]: boolean};
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
        // Talon1024 2018-12-31 - Doing this every time the texture library is constructed is wasteful
        /*
        // Add all textures from texture list lumps
        for(let textureLumpIndex = 1; textureLumpIndex <= 9; textureLumpIndex++){
            const listName = `TEXTURE${textureLumpIndex}`;
            const listLump = fileList.map.get(listName);
            if(listLump != null){
                const list = WADTextures.from(listLump);
                for(const tex of list.enumerateTextures()){
                    this.textures[TextureSet.Walls][tex.name] = tex;
                    this.transparent[TextureSet.Walls][tex.name] = tex.isTransparent(this.fileList);
                }
            }
        }
        // Add flats
        // Check whether the lump is a useless flat marker
        
        // Add all flats, starting from the given lump
        const addFlatsFrom = (lump: WADLump): void => {
            for(const flatLump of lump.enumerateNextLumps()){
                if(flatLump.name === "F_END"){
                    break;
                }
                if(!isFlatMarker(flatLump)){
                    this.textures[TextureSet.Flats][flatLump.name] = WADFlat.from(flatLump);
                    this.transparent[TextureSet.Flats][flatLump.name] = false;
                }
            }
        };
        // IIRC F_START replaces/removes all existing flats
        const flatsStart = this.fileList.map.get("F_START");
        if(flatsStart != null){
            this.textures[TextureSet.Flats] = {};
            addFlatsFrom(flatsStart);
        }
        // Add flats from FF_START-F_END without removing existing ones
        const newFlatsStart = this.fileList.map.get("FF_START");
        if(newFlatsStart != null){
            addFlatsFrom(newFlatsStart);
        }
        */
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
        // Already indexed, so return it immediately
        if(this.textures[set][name]){
            return this.textures[set][name];
        }
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
                    this.textures[set][name] = WADFlat.from(flatLump);
                    this.transparent[set][name] = false;
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
                        this.textures[set][name] = WADFlat.from(flatLump);
                        this.transparent[set][name] = false;
                        if(flatLump.name === name){
                            return this.textures[set][name];
                        }
                    }
                }
            }
        }
        return null;
    }
    isTransparent(name: string, set: TextureSet){
        return this.transparent[set][name] || false;
    }
}

export default TextureLibrary;
