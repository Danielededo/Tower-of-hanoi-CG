#version 300 es

in vec3 vPosition;
uniform mat4 uMVP;
uniform mat4 uMVPFromLight;
out vec4 vPositionFromLight;

void main(void) {
    vPositionFromLight = uMVPFromLight * vec4(vPosition, 1.0); // compute position in light coordinate
    gl_Position = uMVP * vec4(vPosition, 1.0);
}