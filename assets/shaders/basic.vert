out vec3 vertexNormal;
out vec3 vertexColour;
out vec2 textureCoordinate;

void main(){
    vertexNormal = normal;
    vertexColour = color;
    textureCoordinate = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}