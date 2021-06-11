#version 300 es

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;
uniform mat4 uModelView; // MV
uniform mat4 uProjection;
uniform mat4 uNormal;
out vec3 fNormal;
out vec3 fPosition;
out vec2 fTexCoord;

void main(void) {
   
    fNormal = (uNormal * vec4(vNormal, 1.0)).xyz;
    fPosition = (uModelView * vec4(vPosition, 1.0)).xyz;
    fTexCoord = vTexCoord; // texture
    gl_Position = uProjection * uModelView * vec4(vPosition, 1.0); // projection = Perspective * MV
}