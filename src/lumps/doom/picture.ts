import {WADLump} from "@src/wad/lump";

import {WADColors} from "@src/lumps/doom/colors";

export interface WADPicturePost {
    // The raw Y offset value of this post.
    offset: number;
    // The number of pixels represented in this post.
    length: number;
    // The x position where this post begins.
    x: number;
    // The y position where the post begins; i.e. the position of the top pixel.
    y: number;
    // The pixel data for this post.
    // Each pixel is represented as an 8-bit color index.
    data: Buffer;
}

// Represents a patch, sprite, or interface graphic using the vanilla Doom
// engine's picture format.
// See https://doomwiki.org/wiki/Picture_format
export class WADPicture {
    // The name of the graphic.
    name: string;
    // The graphic's raw pixel data.
    // Data begins with a header giving offsets of each column.
    // For each column, there is some number of "posts".
    // Each post represents a run of pixels in that column.
    // Gaps in between posts indicate transparent regions.
    // Each pixel is given as an 8-bit color map index.
    data: Buffer;
    
    constructor(name: string, data: Buffer) {
        this.name = name;
        this.data = data;
    }
    
    // Returns true when a WADLump can be read as a picture.
    // Returns false otherwise.
    static match(lump: WADLump): boolean {
        // Make sure the lump is long enough to hold the header
        if(!lump.data || lump.length < 8){
            return false;
        }
        // Check that the image dimensions make sense
        const width: number = lump.data.readUInt16LE(0);
        const height: number = lump.data.readUInt16LE(2);
        if(width <= 0 || width > 4096 || height <= 0 || height > 4096){
            return false;
        }
        // Make sure all of the column pointers are valid
        const colOffsetsEnd: number = 8 + 4 * width;
        if(lump.length < colOffsetsEnd){
            return false;
        }
        for(let colIndex = 0; colIndex < width; colIndex++){
            const colOffset: number = lump.data.readUInt32LE(8 + (4 * colIndex));
            if(colOffset < colOffsetsEnd || colOffset >= lump.data.length){
                return false;
            }
        }
        // Check each post for correctness
        for(let colIndex: number = 0; colIndex < width; colIndex++){
            let dataOffset: number = lump.data.readUInt32LE(8 + (4 * colIndex));
            while(true){
                const postOffset: number = lump.data.readUInt8(dataOffset);
                if(postOffset === 0xff) break;
                const length: number = lump.data.readUInt8(dataOffset + 1);
                dataOffset += length + 4;
                if(dataOffset >= lump.data.length) return false;
            }
        }
        // This is (probably) a valid picture lump
        return true;
    }
    
    // Create a WADPicture given a WADLump object.
    static from(lump: WADLump): WADPicture {
        if(!this.match(lump)){
            throw new Error("Not a valid picture lump.");
        }
        return new WADPicture(lump.name, <Buffer> lump.data);
    }
    
    // Get the width of the picture in pixels.
    get width(): number {
        return this.data.readUInt16LE(0);
    }
    
    // Get the height of the picture in pixels.
    get height(): number {
        return this.data.readUInt16LE(2);
    }
    
    // Get the X offset of the picture in pixels.
    get x(): number {
        return this.data.readInt16LE(4);
    }
    
    // Get the Y offset of the picture in pixels.
    get y(): number {
        return this.data.readInt16LE(6);
    }
    
    // Count the number of unique colors in the picture.
    countColors(): number {
        const colors: boolean[] = [];
        let count: number = 0;
        for(const post of this.enumeratePosts()){
            for(let postIndex: number = 0; postIndex < post.length; postIndex++){
                const colorIndex: number = post.data.readUInt8(postIndex);
                if(!colors[colorIndex]){
                    colors[colorIndex] = true;
                    count++;
                }
            }
        }
        return count;
    }
    
    // Get the pixel color index at a coordinate.
    // Returns -1 if this is a transparent pixel.
    getPixel(x: number, y: number): number {
        // Enumerate the posts in the requested column and look for a post
        // which includes the requested pixel.
        for(const post of this.enumerateColumnPosts(x)){
            if(post.y <= y && post.y + post.length > y){
                return post.data.readUInt8(y - post.y);
            }
        }
        // Pixel wasn't found in any of this columns posts;
        // this means that the pixel is missing/transparent.
        return -1;
    }
    
    // True when the picture contains any transparent pixels.
    // Returns false when all pixels are opaque.
    hasTransparency(): boolean {
        const width: number = this.width;
        // Enumerate the posts in each column
        for(let colIndex: number = 0; colIndex < width; colIndex++){
            let lastEndOffset: number = 0;
            for(const post of this.enumerateColumnPosts(colIndex)){
                // Compare the starting Y offset of this post to the end
                // of the last post, or to 0 if this is the first post.
                if(post.y != lastEndOffset){
                    return true;
                }
                lastEndOffset = post.y + post.length;
            }
        }
        // All done: found no transparency.
        return false;
    }
    
    // Get pixel data in a standardized format:
    // Four channel 32-bit RGBA color stored in rows and then in columns.
    getPixelDataRGBA(colors: WADColors): Buffer {
        // Create the pixel data: size in pixels * 4 color channels
        const width: number = this.width;
        const height: number = this.height;
        const data: Buffer = Buffer.alloc(width * height * 4, 0);
        // Fill the array from post data
        // Pixels in between posts will be skipped; it will remain 0x00000000,
        // i.e. correctly transparent.
        for(const post of this.enumeratePosts()){
            for(let postIndex: number = 0; postIndex < post.length; postIndex++){
                const colorIndex: number = post.data.readUInt8(postIndex);
                const colorRGBA: number = colors.getColorRGBA(colorIndex);
                const pixelIndex = post.x + (width * (postIndex + post.y));
                data.writeUInt32LE(colorRGBA, 4 * pixelIndex);
            }
        }
        // All done
        return data;
    }
    
    // Enumerate a list of posts which make up the image data.
    *enumeratePosts(): Iterable<WADPicturePost> {
        const width: number = this.width;
        // Enumerate the posts in each column
        for(let colIndex: number = 0; colIndex < width; colIndex++){
            for(const post of this.enumerateColumnPosts(colIndex)){
                yield post;
            }
        }
    }
    
    // Enumerate a list of posts which make up a column of the image data.
    *enumerateColumnPosts(colIndex: number): Iterable<WADPicturePost> {
        // Read the in-lump offset where this column's post data begins
        let dataOffset: number = this.data.readUInt32LE(8 + (4 * colIndex));
        let lastPostOffset: number = 0;
        // Keep reading posts until either:
        // - Ran into a terminating post offset value (0xff)
        // - There's no more data in the lump (shouldn't happen)
        while(dataOffset + 1 < this.data.length){
            const postOffset: number = this.data.readUInt8(dataOffset);
            // Special value of 255 is the terminator (no more data)
            if(postOffset === 0xff){
                break;
            }
            // Get the size of this post (and compute the start of the next one)
            const postLength: number = this.data.readUInt8(dataOffset + 1);
            const nextDataOffset: number = dataOffset + postLength + 4;
            // Account for DeePsea tall patches:
            // If this post's y offset is less than or equal to the previous
            // offset, then the true offset is their sum.
            const yPosition: number = (postOffset <= lastPostOffset ?
                postOffset + lastPostOffset : postOffset
            );
            // Yield the post's data...
            // Note that there is a single byte of padding between the post
            // length byte and the first pixel data byte, and another byte of
            // padding between the last pixel data byte and the following post.
            // The first padding byte is the same as the first byte in the
            // post's pixel data and the second padding byte is the same as
            // the last byte in the post's pixel data.
            yield {
                offset: postOffset,
                length: postLength,
                x: colIndex,
                y: yPosition,
                data: this.data.slice(dataOffset + 3, nextDataOffset - 1),
            };
            // Get ready to read the next post
            dataOffset = nextDataOffset;
        }
    }
}

export default WADPicture;
