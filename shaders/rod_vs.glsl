#version 300 es

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;
uniform mat4 uModelView;
uniform mat4 uProjection;
uniform mat4 uNormal;
uniform mat4 uMVPFromLight;
out vec3 fNormal;
out vec3 fPosition;
out vec2 fTexCoord;
out vec4 vPositionFromLight;

void main(void) {
    vPositionFromLight = uMVPFromLight * vec4(vPosition, 1.0); // compute position in light coordinate
    fNormal = (uNormal * vec4(vNormal, 1.0)).xyz; // normals in camera coordinate
    fPosition = (uModelView * vec4(vPosition, 1.0)).xyz; // vertex position in camera coordinate
    fTexCoord = vTexCoord;
    gl_Position = uProjection * uModelView * vec4(vPosition, 1.0);
}