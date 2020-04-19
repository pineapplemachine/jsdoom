// Mappable thing - image or quad
export interface Mappable {
    // The width of the quad/texture in map units
    width: number;
    // The height of the quad/texture in map units
    // For quads, negative values will force the height to be re-calculated
    // based on the texture's height
    height: number;
    // The X scale of the quad or texture.
    xScale?: number;
    // The Y scale of the quad or texture.
    yScale?: number;
}
