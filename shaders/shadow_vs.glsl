#version 300 es

in vec3 vPosition;
uniform mat4 uMVP; // model-view-projection matrix

void main(void) {
    gl_Position = uMVP * vec4(vPosition, 1.0); // compute position in light coordinate
}