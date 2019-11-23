export interface MapGeometryOptions {
    // Draw dots at each vertex
    drawVertexes?: boolean;
    // Draw lines for each linedef
    drawLines?: boolean;
    // Draw circles for each thing
    drawThings?: boolean;
    // Leave at least this many pixels of blank space between the map
    // geometry and the canvas border. (Defaults to 50px)
    margin?: number;
}
