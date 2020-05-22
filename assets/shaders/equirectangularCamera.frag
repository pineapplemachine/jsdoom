#define PI 3.1415926535897932384626433

varying vec2 vUv;
uniform samplerCube tex;
uniform int projectionMode;

// Enumerated constants for projection mode
#define PROJECTION_EQUIRECTANGULAR 0
#define PROJECTION_CUBE 1

// Enumerated constants for cubeFace function
#define FACE_LEFT 0
#define FACE_FRONT 1
#define FACE_RIGHT 2
#define FACE_TOP 3
#define FACE_BOTTOM 4
#define FACE_BACK 5

#define HFACES 3.
#define VFACES 2.

// These are in column-major order
// Return an X rotation matrix for the given angle in radians
mat3 rotationX(float angle){
    return mat3(
        1., 0., 0.,
        0., cos(angle), sin(angle),
        0., -sin(angle), cos(angle)
    );
}

// Return a Y rotation matrix for the given angle in radians
mat3 rotationY(float angle){
    return mat3(
        cos(angle), 0., -sin(angle),
        0., 1., 0.,
        sin(angle), 0., cos(angle)
    );
}

// Return a Z rotation matrix for the given angle in radians
mat3 rotationZ(float angle){
    return mat3(
        cos(angle), sin(angle), 0.,
        -sin(angle), cos(angle), 0.,
        0., 0., 1.
    );
}

// Return the direction vector for equirectangular projection
vec3 equirectangularDirection(vec2 coords){
    float longitude = coords.x * PI * -2.;
    float latitude = coords.y * PI;
    vec3 direction = vec3(
        sin(latitude) * cos(longitude),
        sin(latitude) * sin(longitude),
        cos(latitude)
    );
    direction = direction * rotationX(.5 * PI) * rotationY(-1.5 * PI);
    return direction;
}

// Return the direction vector for cube projection
vec3 cubeFace(vec2 coords, int face){
    vec2 normalizedCoords = (coords - .5) * 2.;
    vec3 direction = vec3(normalizedCoords, 1.);
    direction = normalize(direction);
    direction *= rotationX(PI);
    if(face == FACE_LEFT){
        direction *= rotationY(-.5 * PI);
    }else if(face == FACE_RIGHT){
        direction *= rotationY(.5 * PI);
    }else if(face == FACE_BOTTOM){
        direction *= rotationX(.5 * PI);
    }else if(face == FACE_TOP){
        direction *= rotationX(-.5 * PI);
    }else if(face == FACE_BACK){
        direction *= rotationY(PI);
    }
    return direction;
}

void main(){
    // When looking up texels from a cubemap sampler, the
    // vector is from the center of the cube to the texel.
    vec3 direction = vec3(0.);
    if(projectionMode == PROJECTION_EQUIRECTANGULAR){
        direction = equirectangularDirection(vUv);
    }else if(projectionMode == PROJECTION_CUBE){
        vec2 cubeSize = vec2(HFACES, VFACES);
        vec2 cubeFaceSize = vec2(1./HFACES, 1./VFACES);
        int face = int(floor(vUv.x * cubeSize.x)) + int(floor(vUv.y * cubeSize.y) * HFACES);
        vec2 coords = mod(vUv, cubeFaceSize) * cubeSize;
        direction = cubeFace(coords, face);
    }
    gl_FragColor = texture(tex, direction);
}