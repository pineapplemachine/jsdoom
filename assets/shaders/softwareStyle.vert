/*
// Already defined
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec3 color;
*/

in int light;
out float distance;
flat out int lightlevel;
out vec3 vertexNormal;
flat out vec3 lineNormal;
out vec2 textureCoordinate;

void main(){
    vec4 aPos = vec4(position, 1.);
    textureCoordinate = uv;
    lineNormal = vertexNormal = normal;
    // Assume Doom-style lighting is being used
    lightlevel = light;
    gl_Position = projectionMatrix * modelViewMatrix * aPos;
    distance = gl_Position.z;
}