#version 300 es

in vec3 vPosition;
in vec3 vNormal;
uniform mat4 uModelView;
uniform mat4 uProjection;
uniform mat4 uNormal;
out vec3 fNormal;
out vec3 fPosition; // vertex position in camera coordinate

void main(void) {
    
    fNormal = (uNormal * vec4(vNormal, 1.0)).xyz; // normals in camera coordinate
    fPosition = (uModelView * vec4(vPosition, 1.0)).xyz; // vertex position in camera coordinate
    gl_Position = uProjection * uModelView * vec4(vPosition, 1.0);
}