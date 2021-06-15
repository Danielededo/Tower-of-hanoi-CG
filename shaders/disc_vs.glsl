#version 300 es

in vec3 vPosition;
in vec3 vNormal;
uniform mat4 uModel; // modelM
uniform mat4 uView; // viewM
uniform mat4 uProjection; // perspectiveM
uniform mat4 uNormal; // (M^T)^-1 = inverse of the transposed modelM
out vec3 fNormal;
out vec3 fPosition;

void main(void) {
    
    fNormal = (uNormal * vec4(vNormal, 1.0)).xyz;
    fPosition = (uModel * vec4(vPosition, 1.0)).xyz;
    gl_Position = uProjection * uView * uModel * vec4(vPosition, 1.0); // perspective * View * Model
}