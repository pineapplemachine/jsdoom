// Mimics the node JS Buffer interface, but is backed by the browser-compatible
// ArrayBuffer, Uint8Array, and DataView types.
// TODO: Use this instead of node's Buffer type.
export class DataBuffer {
    // A Uint8Array over the backing ArrayBuffer.
    readonly array: Uint8Array;
    // A DataView over the backing ArrayBuffer.
    readonly view: DataView;
    
    // Create a new DataBuffer. Accepts a Uint8Array.
    constructor(array: Uint8Array) {
        this.array = array;
        this.view = new DataView(
            array.buffer, array.byteOffset, array.byteLength
        );
    }
    
    // Allocates a new DataBuffer with the given length in bytes.
    // The data is zero-initialized.
    static alloc(size: number, fill: number = 0): DataBuffer {
        const array: Uint8Array = new Uint8Array(
            new ArrayBuffer(size), 0, size
        );
        for(let i = 0; i < size; i++){
            array[i] = fill;
        }
        return new DataBuffer(array);
    }
    
    // Concatenate a list of DataBuffer inputs.
    // Requires an explicit combined byte length argument.
    static concat(list: DataBuffer[], size: number): DataBuffer {
        let byteLength: number = 0;
        if(size !== null){
            byteLength = size;
        }else{
            for(const buffer of list){
                byteLength += buffer.length;
            }
        }
        const concat: DataBuffer = DataBuffer.alloc(byteLength);
        let byteOffset: number = 0;
        for(const buffer of list){
            const endOffset: number = byteOffset + buffer.length;
            if(endOffset <= byteLength){
                concat.copy(buffer, byteOffset);
                byteOffset += endOffset;
            }else{
                concat.copy(buffer.slice(0, size - byteOffset), byteOffset);
                break;
            }
        }
        return concat;
    }
    
    // Create a DataBuffer from an array of unsigned bytes.
    static from(array: ArrayLike<number> | ArrayBuffer): DataBuffer {
        if(array instanceof ArrayBuffer){
            array = new Uint8Array(array);
        }
        const buffer: DataBuffer = DataBuffer.alloc(array.length);
        buffer.array.set(array);
        return buffer;
    }
    
    // Get the underlying ArrayBuffer object.
    get buffer(): ArrayBuffer {
        // ES2017 has SharedArrayBuffer, which causes TypeScript
        // compilation errors, since TypedArray.buffer can be either
        // ArrayBuffer or SharedArrayBuffer
        return this.array.buffer as ArrayBuffer;
    }
    
    // Get the length of the buffer in bytes.
    get length(): number {
        return this.array.byteLength;
    }
    
    // Get this DataBuffer as a Node buffer
    get nodeBuffer(): Buffer {
        return new Buffer(this.buffer);
    }
    
    // Fills the entire buffer with a singlebyte value.
    fill(value: number): void {
        this.array.fill(value);
    }
    
    // Get a slice of this buffer.
    // The slice is another view into the same data. It is NOT a copy.
    slice(low: number, high: number): DataBuffer {
        return new DataBuffer(this.array.subarray(low, high));
    }
    
    // Get a new DataBuffer containing a copy of this one's data.
    clone(): DataBuffer {
        const array: Uint8Array = new Uint8Array(
            new ArrayBuffer(this.length), 0, this.length
        );
        const buffer: DataBuffer = new DataBuffer(array);
        buffer.copy(this, 0);
        return buffer;
    }
    
    // Copy data from one buffer into this one.
    // The buffer is completely copied and stored at the given byte offset.
    copy(source: DataBuffer, offset: number, srcOffset: number = 0, srcEnd: number = source.length): void {
        this.array.set(source.array.slice(srcOffset, srcEnd), offset);
    }
    
    // Compare the data in this buffer with the data in another one.
    // Return true if both buffers have the same contents
    equals(other: DataBuffer): boolean {
        if(other.array.length !== this.array.length){
            return false;
        }
        for(let i = 0; i < this.array.length; i++){
            const thisByte = this.array[i];
            const otherByte = other.array[i];
            if(thisByte !== otherByte){
                return false;
            }
        }
        return true;
    }
    
    some(predicate: (byte: number) => boolean): boolean {
        return this.array.some(predicate);
    }
    
    // Get the signed 8-bit number at a byte offset.
    readInt8(offset: number): number {
        return this.view.getInt8(offset);
    }
    // Get the signed 16-bit little-endian number at a byte offset.
    readInt16LE(offset: number): number {
        return this.view.getInt16(offset, true);
    }
    // Get the signed 16-bit big-endian number at a byte offset.
    readInt16BE(offset: number): number {
        return this.view.getInt16(offset, false);
    }
    // Get the signed 32-bit little-endian number at a byte offset.
    readInt32LE(offset: number): number {
        return this.view.getInt32(offset, true);
    }
    // Get the signed 32-bit big-endian number at a byte offset.
    readInt32BE(offset: number): number {
        return this.view.getInt32(offset, false);
    }
    
    // Get the unsigned 8-bit number at a byte offset.
    readUInt8(offset: number): number {
        return this.view.getUint8(offset);
    }
    // Get the unsigned 16-bit little-endian number at a byte offset.
    readUInt16LE(offset: number): number {
        return this.view.getUint16(offset, true);
    }
    // Get the unsigned 16-bit big-endian number at a byte offset.
    readUInt16BE(offset: number): number {
        return this.view.getUint16(offset, false);
    }
    // Get the unsigned 32-bit little-endian number at a byte offset.
    readUInt32LE(offset: number): number {
        return this.view.getUint32(offset, true);
    }
    // Get the unsigned 32-bit big-endian number at a byte offset.
    readUInt32BE(offset: number): number {
        return this.view.getUint32(offset, false);
    }
    
    // Get the 32-bit little-endian floating point number at a byte offset.
    readFloatLE(offset: number): number {
        return this.view.getFloat32(offset, true);
    }
    // Get the 32-bit big-endian floating point number at a byte offset.
    readFloatBE(offset: number): number {
        return this.view.getFloat32(offset, false);
    }
    // Get the 64-bit little-endian floating point number at a byte offset.
    readDoubleLE(offset: number): number {
        return this.view.getFloat64(offset, true);
    }
    // Get the 64-bit big-endian floating point number at a byte offset.
    readDoubleBE(offset: number): number {
        return this.view.getFloat64(offset, false);
    }
    
    // Set the signed 8-bit number at a byte offset.
    writeInt8(value: number, offset: number): void {
        this.view.setInt8(offset, value);
    }
    // Set the signed 16-bit little-endian number at a byte offset.
    writeInt16LE(value: number, offset: number): void {
        this.view.setInt16(offset, value, true);
    }
    // Set the signed 16-bit big-endian number at a byte offset.
    writeInt16BE(value: number, offset: number): void {
        this.view.setInt16(offset, value, false);
    }
    // Set the signed 32-bit little-endian number at a byte offset.
    writeInt32LE(value: number, offset: number): void {
        this.view.setInt32(offset, value, true);
    }
    // Set the signed 32-bit big-endian number at a byte offset.
    writeInt32BE(value: number, offset: number): void {
        this.view.setInt32(offset, value, false);
    }
    
    // Set the unsigned 8-bit number at a byte offset.
    writeUInt8(value: number, offset: number): void {
        this.view.setUint8(offset, value);
    }
    // Set the unsigned 16-bit little-endian number at a byte offset.
    writeUInt16LE(value: number, offset: number): void {
        this.view.setUint16(offset, value, true);
    }
    // Set the unsigned 16-bit big-endian number at a byte offset.
    writeUInt16BE(value: number, offset: number): void {
        this.view.setUint16(offset, value, false);
    }
    // Set the unsigned 32-bit little-endian number at a byte offset.
    writeUInt32LE(value: number, offset: number): void {
        this.view.setUint32(offset, value, true);
    }
    // Set the unsigned 32-bit big-endian number at a byte offset.
    writeUInt32BE(value: number, offset: number): void {
        this.view.setUint32(offset, value, false);
    }
    
    // Set the 32-bit little-endian floating point number at a byte offset.
    writeFloatLE(value: number, offset: number): void {
        this.view.setFloat32(offset, value, true);
    }
    // Set the 32-bit big-endian floating point number at a byte offset.
    writeFloatBE(value: number, offset: number): void {
        this.view.setFloat32(offset, value, false);
    }
    // Set the 64-bit little-endian floating point number at a byte offset.
    writeDoubleLE(value: number, offset: number): void {
        this.view.setFloat64(offset, value, true);
    }
    // Set the 64-bit big-endian floating point number at a byte offset.
    writeDoubleBE(value: number, offset: number): void {
        this.view.setFloat64(offset, value, false);
    }
}
