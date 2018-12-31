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
        const isFlatMarker = (lump: WADLump): boolean => {
            const name = lump.name;
            return (
                name === "F1_START" || name === "F2_START" ||
                name === "F1_END" || name === "F2_END" ||
                lump.dataLength === 0
            );
        };
        // Add all flats, starting from lump
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
    }
    get(name: string, set: TextureSet){
        return this.textures[set][name] || null;
    }
    isTransparent(name: string, set: TextureSet){
        return this.transparent[set][name] || false;
    }
}

export default TextureLibrary;
