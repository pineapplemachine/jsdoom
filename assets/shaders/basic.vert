in vec2 mirror;
out vec2 mirrorTexCoords;
out vec3 vertexNormal;
out vec3 vertexColour;
out vec2 textureCoordinate;

void main(){
    vertexNormal = normal;
    vertexColour = color;
    textureCoordinate = uv;
    mirrorTexCoords = mirror;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}