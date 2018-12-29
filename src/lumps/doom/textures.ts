import {WADFileList} from "@src/wad/fileList";
import {WADLump} from "@src/wad/lump";
import {readPaddedString8} from "@src/wad/string";

import {WADColors} from "@src/lumps/doom/colors";
import {WADPatches} from "@src/lumps/doom/patches";
import {WADPicture, WADPicturePost} from "@src/lumps/doom/picture";

// Represents a single texture from a TEXTURE lump.
export class WADTexture {
    // An eight-character case-insensitive ASCII string identifying
    // this particular texture.
    name: string;
    // Texture flags. There is only one recognized flag, 0x8000, the
    // "WorldPanning" flag. When the flag is set, it means that texture
    // offsets should be applied by world units instead of by pixels
    // in the texture.
    flags: number;
    // The total width of the texture.
    width: number;
    // The total height of the texture.
    height: number;
    // Obsolete data ignored by all versions of Doom.
    columnDirectory: number;
    // A list of patches which make up this texture.
    patches: WADTexturePatch[];
    
    constructor(options: {
        name: string,
        flags: number,
        width: number,
        height: number,
        columnDirectory: number,
        patches: WADTexturePatch[],
    }) {
        this.name = options.name;
        this.flags = options.flags;
        this.width = options.width;
        this.height = options.height;
        this.columnDirectory = options.columnDirectory;
        this.patches = options.patches;
    }
    
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(files: WADFileList, colors?: WADColors): Buffer {
        const useColors: WADColors = colors || files.getColors();
        // Create the pixel data: size in pixels * 4 color channels
        const data: Buffer = Buffer.alloc(this.width * this.height * 4, 0);
        // Get texture patches as WADPicture objects.
        const pictures: (WADPicture | null)[] = this.getPatchPictures(files);
        // Store patch posts in memory so that they don't have to be
        // constantly recomputed.
        const posts: WADPicturePost[][][] = this.getPatchPosts(pictures);
        console.log(this.patches);
        console.log(pictures);
        // console.log(pictures.map(p => p && `${p.x}, ${p.y}`));
        // Enumerate each pixel in the output image
        // Pixels not covered by any patch are skipped; they will remain
        // as 0x00000000, i.e. correctly transparent.
        for(let x: number = 0; x < this.width; x++){
            for(let y: number = 0; y < this.height; y++){
                // Find the last (topmost) patch to intersect this pixel
                EnumeratePatches: for(
                    let patchIndex: number = this.patches.length - 1;
                    patchIndex >= 0; patchIndex--
                ){
                    // Picture data for this patch
                    const picPatch: (WADPicture | null) = pictures[patchIndex];
                    if(!picPatch){
                        continue;
                    }
                    // Offset data for this patch
                    const texPatch: WADTexturePatch = this.patches[patchIndex];
                    // Check if pixel is within the bounds of the patch
                    // First compute X and Y coordinate within this patch
                    const patchX: number = x - (texPatch.x);
                    const patchY: number = y - (texPatch.y);
                    if(
                        patchX < 0 || patchX >= picPatch.width ||
                        patchY < 0 || patchY >= picPatch.height
                    ){
                        continue;
                    }
                    // Find the post intersecting this pixel, if any
                    for(const post of posts[patchIndex][patchX]){
                        // Check if this post intersects
                        if(!post || (
                            post.y > patchY || post.y + post.length <= patchY
                        )){
                            continue;
                        }
                        // It does!
                        const postIndex: number = patchY - post.y;
                        const colorIndex: number = post.data.readUInt8(postIndex);
                        const colorRGBA: number = useColors.getColorRGBA(colorIndex);
                        const pixelIndex = x + (this.width * y);
                        data.writeUInt32LE(colorRGBA, 4 * pixelIndex);
                        // Move on to the next pixel
                        break EnumeratePatches;
                    }
                }
            }
        }
        // All done
        return data;
    }
    
    // Get a list of WADPicture objects corresponding to the texture's
    // patch list. Array indexes which correspond to unknown or invalid
    // patches will be populated with null values.
    getPatchPictures(files: WADFileList): (WADPicture | null)[] {
        // Get the PNAMES lump since texture patches are referenced by
        // their index in the PNAMES patch table.
        const patchesLump: (WADLump | null) = files.map.get("PNAMES");
        if(!patchesLump){
            throw new Error("Found no PNAMES lump.");
        }
        const patches: WADPatches = WADPatches.from(patchesLump);
        // Map texture patches to valid picture lumps, or null for missing
        // or invalid patches.
        const pictures: (WADPicture | null)[] = [];
        GetPicture: for(const patch of this.patches){
            const name: string = patches.getPatchName(patch.patchIndex);
            // Check if this is a duplicate and use the same WADPicture
            // object if so
            for(const picture of pictures){
                if(picture && name === picture.name){
                    pictures.push(picture);
                    continue GetPicture;
                }
            }
            // Otherwise, look for the patch lump
            const lump: (WADLump | null) = files.map.get(name);
            // Lump is missing
            if(!lump){
                pictures.push(null);
                continue;
            }
            try{
                const picture: WADPicture = WADPicture.from(lump);
                pictures.push(picture);
            // Lump was invalid
            }catch(error){
                pictures.push(null);
            }
        }
        // All done
        return pictures;
    }
    
    // Internal helper used by getPixelDataRGBA.
    // Computes all posts for all patches in the texture and stores them
    // in an array. The output array is indexed like so:
    // patchData[patchIndex][columnIndex][postIndex];
    // At patch indexes which corresponded to a missing/invalid patch,
    // the columns array will be empty. To illustrate:
    // patchData[invalidPatchIndex] === [];
    getPatchPosts(patches: (WADPicture | null)[]): WADPicturePost[][][] {
        // TODO: only compute posts once per unique WADPicture; use the
        // same array reference for duplicate apperances
        const posts: WADPicturePost[][][] = [];
        for(const patch of patches){
            if(patch){
                const columns: WADPicturePost[][] = [];
                const patchWidth: number = patch.width;
                posts.push(columns);
                for(let colIndex: number = 0; colIndex < patchWidth; colIndex++){
                    columns.push(Array.from(patch.enumerateColumnPosts(colIndex)));
                }
            }else{
                posts.push([]);
            }
        }
        return posts;
    }
    
    isTransparent(files: WADFileList, colors?: WADColors): boolean {
        const data = this.getPixelDataRGBA(files, colors);
        for(let pixel = 0; pixel < data.byteLength / 4; pixel++){
            const alpha = (data.readUInt32LE(pixel * 4) & 0xff000000) >> 24;
            if(alpha < 255){
                return true;
            }
        }
        return false;
    }
    
    get worldPanning(): boolean {
        return (this.flags & 0x8000) > 0;
    }
}

// Represents a single patch in a single texture in a TEXTURE lump.
export interface WADTexturePatch {
    // The horizontal offset of the patch, relative to the top left corner
    // of the texture.
    x: number;
    // The vertical offset of the patch, relative to the top left corner
    // of the texture.
    y: number;
    // The index of this texture in the "PNAMES" patch table.
    patchIndex: number;
    // Not used.
    mirrored: number;
    // Not used.
    colormap: number;
}

// Represents a textures ("TEXTURE1" or "TEXTURE2") lump.
// Textures tell the engine how to combine patches in order to form wall
// textures.
// See: https://doomwiki.org/wiki/TEXTURE1_and_TEXTURE2
export class WADTextures {
    // Texture lumps should always be named "TEXTURE1" or "TEXTURE2".
    // jsdoom is extra permissive and allows "TEXTURE3" through "TEXTURE9";
    // DelphiDoom supports a "TEXUTRE3" lump, so this isn't entirely novel.
    static readonly LumpNamePrefix: string = "TEXTURE";
    
    // The binary data representing this textures lump.
    data: Buffer;
    
    constructor(data: Buffer) {
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as textures.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        const upperName: string = lump.name.toUpperCase();
        return lump.length >= 4 && (
            upperName.startsWith(WADTextures.LumpNamePrefix) &&
            "0123456789".indexOf(upperName[upperName.length - 1]) >= 0
        );
    }
    
    // Create a WADTextures given a WADLump object.
    static from(lump: WADLump): WADTextures {
        if(!this.match(lump)){
            throw new Error("Not a valid TEXTURE lump.");
        }
        return new WADTextures(lump.data as Buffer);
    }
    
    // Get the number of textures represented in the lump.
    get length(): number {
        return this.data.readUInt32LE(0);
    }
    
    // Get a WADTexture by its name. Names are matched case-insensitively.
    // Returns the first matching texture.
    // Returns null if the name doesn't match any textures.
    getTextureByName(name: string): (WADTexture | null) {
        const upperName: string = name.toUpperCase();
        const length: number = this.length;
        for(let texIndex: number = 0; texIndex < length; texIndex++){
            const texOffset: number = this.data.readUInt32LE(4 + (4 * texIndex));
            const texName: string = readPaddedString8(this.data, texOffset);
            if(upperName === texName.toUpperCase()){
                return this.readTextureAt(texOffset);
            }
        }
        return null;
    }
    
    // Enumerate all textures in the lump.
    *enumerateTextures(): Iterable<WADTexture> {
        const length: number = this.length;
        for(let texIndex: number = 0; texIndex < length; texIndex++){
            const texOffset: number = this.data.readUInt32LE(4 + (4 * texIndex));
            yield this.readTextureAt(texOffset);
        }
    }
    
    // Helper to read the WADTexture at an offset in the lump.
    // Intended for internal use.
    readTextureAt(texOffset: number): WADTexture {
        // Read the patch list
        const patchCount: number = this.data.readUInt16LE(texOffset + 20);
        const patches: WADTexturePatch[] = [];
        for(let patchIndex: number = 0; patchIndex < patchCount; patchIndex++){
            const patchOffset: number = texOffset + 22 + (10 * patchIndex);
            patches.push({
                x: this.data.readInt16LE(patchOffset),
                y: this.data.readInt16LE(patchOffset + 2),
                patchIndex: this.data.readUInt16LE(patchOffset + 4),
                mirrored: this.data.readUInt16LE(patchOffset + 6),
                colormap: this.data.readUInt16LE(patchOffset + 8),
            });
        }
        // Read and return the texture object
        return new WADTexture({
            name: readPaddedString8(this.data, texOffset),
            flags: this.data.readUInt32LE(texOffset + 8),
            width: this.data.readUInt16LE(texOffset + 12),
            height: this.data.readUInt16LE(texOffset + 14),
            columnDirectory: this.data.readUInt32LE(texOffset + 16),
            patches: patches,
        });
    }
}

export class TextureLibrary {
    public textures: {[name: string]: WADTexture};
    public fileList: WADFileList;
    constructor(fileList: WADFileList){
        this.fileList = fileList;
        this.textures = {};
        const libraryLumps = [];
        for(const wad of fileList.files){
            for(let textureLumpIndex = 1; textureLumpIndex <= 9; textureLumpIndex++){
                const libraryLump = wad.firstByName(`TEXTURE${textureLumpIndex}`);
                if(libraryLump != null){
                    libraryLumps.push(WADTextures.from(libraryLump));
                }
            }
        }
        for (const libraryLump of libraryLumps){
            for(const tex of libraryLump.enumerateTextures()){
                this.textures[tex.name] = tex;
            }
        }
    }
}

export default WADTextures;
