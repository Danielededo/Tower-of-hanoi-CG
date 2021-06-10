#version 300 es

in vec3 vPosition;
in vec3 vNormal;
uniform mat4 uModelView;
uniform mat4 uProjection;
uniform mat4 uNormal;
uniform mat4 uMVPFromLight;
out vec3 fNormal;
out vec3 fPosition; // vertex position in camera coordinate
out vec3 uPosition; // pass on the original coordinate from the vertex shader to the fragment shader
// for procedure texture

void main(void) {
    
    fNormal = (uNormal * vec4(vNormal, 1.0)).xyz; // normals in camera coordinate
    uPosition = vPosition; // vertex position in model coordinate
    fPosition = (uModelView * vec4(vPosition, 1.0)).xyz; // vertex position in camera coordinate
    gl_Position = uProjection * uModelView * vec4(vPosition, 1.0);
}