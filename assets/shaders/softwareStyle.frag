#define APPLY_FAKE_CONTRAST

uniform sampler2D image; // Paletted image
uniform sampler2D colours; // Colourmap
uniform int maxColourmap;
uniform bool paletteInterpolation;

in float viewDistance;
flat in int lightlevel;
in vec3 vertexNormal;
flat in vec3 lineNormal;
in vec2 textureCoordinate;

int mapIndex(int lightmap, int distcmap){
    // From the Chocolate Doom source
    // #define LIGHTLEVELS 16
    // #define NUMCOLORMAPS 32
    // #define DISTMAP 2
    int startmap = (15 - lightmap) * 4;
    return startmap - distcmap / 2;
}

int getColormapIndex(int distanceOffset, out float blendFactor){
    float dist;
    // Eyeballed approximation - not perfect by any means!
    blendFactor = modf(viewDistance / 24., dist);
    int distcmap = max(24 - int(dist), 0);
    int colormapIndex = mapIndex((lightlevel >> 4), distcmap + distanceOffset);
    #ifdef APPLY_FAKE_CONTRAST
    vec3 horizontal = vec3(1., 0., 0.);
    vec3 vertical = vec3(0., 0., 1.);
    // A "3D interpretation" of the first few lines of R_RenderMaskedSegRange
    if(abs(dot(lineNormal, horizontal)) == 1.){
        colormapIndex -= 1;
    }else if(abs(dot(lineNormal, vertical)) == 1.){
        colormapIndex += 1;
    }
    #endif
    return clamp(colormapIndex, 0, maxColourmap);
}

void main(){
    vec4 paltexel = texture(image, textureCoordinate);
    float alpha = paltexel.g;
    #ifdef ALPHATEST
    if(alpha < ALPHATEST){
        discard;
    }
    #endif
    float blendFactor;
    int colourmapY = getColormapIndex(0, blendFactor);
    int colourmapX = int(floor(min(paltexel.r * 256., 255.)));
    ivec2 colourmapUv = ivec2(colourmapX, colourmapY);
    vec3 rgb = texelFetch(colours, colourmapUv, 0).rgb;
    vec4 texel = vec4(1.);
    if(paletteInterpolation){
        ivec2 colourmapUvNext = ivec2(colourmapUv);
        colourmapUvNext.y = getColormapIndex(1, blendFactor);
        vec3 rgbNext = texelFetch(colours, colourmapUvNext, 0).rgb;
        texel = vec4(mix(rgbNext, rgb, blendFactor), alpha);
    }else{
        texel = vec4(rgb, alpha);
    }
    gl_FragColor = texel;
}