#define APPLY_FAKE_CONTRAST

uniform sampler2D image; // Paletted image
uniform sampler2D colours; // Colourmap
uniform int maxColourmap;

in float distance;
flat in int lightlevel;
in vec3 vertexNormal;
flat in vec3 lineNormal;
in vec2 textureCoordinate;

int getColormapIndex(){
    // From the Chocolate Doom source
    // #define LIGHTLEVELS 16
    // #define NUMCOLORMAPS 32
    // #define DISTMAP 2
    // startmap = (15 - i) * 4;
    // level = startmap - j / DISTMAP;
    int index = int(distance / 16.);
    #ifdef APPLY_FAKE_CONTRAST
    vec3 horizontal = vec3(1., 0., 0.);
    vec3 vertical = vec3(0., 0., 1.);
    // A "3D interpretation" of the first few lines of R_RenderMaskedSegRange
    if(abs(dot(lineNormal, horizontal)) == 1.){
        index -= 1;
    }else if(abs(dot(lineNormal, vertical)) == 1.){
        index += 1;
    }
    #endif
    return clamp(index, 0, maxColourmap);
}

void main(){
    vec4 paltexel = texture(image, textureCoordinate);
    int colourmapY = getColormapIndex();
    int colourmapX = int(paltexel.r * 255.);
    float alpha = paltexel.g;
    ivec2 colourmapUv = ivec2(colourmapX, colourmapY);
    vec3 rgb = texelFetch(colours, colourmapUv, 0).rgb;
    vec4 texel = vec4(rgb, alpha);
    gl_FragColor = texel;
}