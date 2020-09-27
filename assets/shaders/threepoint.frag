uniform sampler2D tex;

in vec2 textureCoordinate;
in vec3 vertexColour;
in vec2 mirrorTexCoords;

// Mirror UV coordinates
float mirrorUV(float uvCoord){
    float coord = mod(uvCoord, 2.);
    if(coord > 1.){
        return 1. - coord;
    }
    return coord;
}

vec2 mirrorUV(vec2 uv, bvec2 mirror){
    if(mirror.x){
        uv.x = mirrorUV(uv.x);
    }
    if(mirror.y){
        uv.y = mirrorUV(uv.y);
    }
    return uv;
}

// Based on HLSL code by ArthurCarvalho from this forum thread:
// http://www.emutalk.net/threads/54215-Emulating-Nintendo-64-3-sample-Bilinear-Filtering-using-Shaders

vec4 n64BilinearFilter(vec2 uv, vec2 tex_res, sampler2D tex, vec4 vtx_color){
    float TexX = 0.; // Unused, but required for modf
    float TexY = 0.;

    vec2 pixelsize = 1. / tex_res;
    vec2 half_tex = pixelsize * .5;
    vec2 UVCentered = uv - half_tex;
    vec2 pixelcenter = (floor(UVCentered * tex_res) + .5) / tex_res;
    vec2 UVA = pixelcenter;
    vec2 UVB = UVA; UVB.x += 1. * pixelsize.x;
    vec2 UVC = UVA; UVC.y += 1. * pixelsize.y;
    vec2 UVD = UVA + 1. * pixelsize;

    vec4 diffuseColor = texture(tex, UVA);
    vec4 sample_a = texture(tex, UVB);
    vec4 sample_b = texture(tex, UVC);
    vec4 sample_c = texture(tex, UVD);

    float interp_x = modf(UVCentered.x * tex_res.x, TexX);
    float interp_y = modf(UVCentered.y * tex_res.y, TexY);

    if (UVCentered.x < 0.)
    {
        interp_x = 1.-interp_x*(-1.);
    }
    if (UVCentered.y < 0.)
    {
        interp_y = 1.-interp_y*(-1.);
    }

    diffuseColor = (diffuseColor + interp_x * (sample_a - diffuseColor) + interp_y * (sample_b - diffuseColor)) * (1.-step(1., interp_x + interp_y));
    diffuseColor += (sample_c + (1.-interp_x) * (sample_b - sample_c) + (1.-interp_y) * (sample_a - sample_c))*step(1., interp_x + interp_y);

    return diffuseColor * vtx_color;
}

void main()
{
    vec2 tex_res = vec2(textureSize(tex, 0));
    bvec2 shouldMirror = bvec2(mirrorTexCoords.x > 0., mirrorTexCoords.y > 0.);
    vec2 uv = mirrorUV(textureCoordinate, shouldMirror);
    vec4 pixel = n64BilinearFilter(uv, tex_res, tex, vec4(vertexColour, 1.));
    #ifdef ALPHATEST
    if(pixel.a < ALPHATEST){
        discard;
    }
    #endif
    gl_FragColor = pixel;
}
