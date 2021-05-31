#version 300 es

#ifdef GL_ES
precision highp float;
#endif
// we use a texture as the depth map and all channels of a texture (r, g, b and a) are 8-bit, so every point in
// a texture is 32-bit. Float here is 16-bit, so if we utilize all 32 bits in a texture, it is quite sufficient.
const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
const vec4 bitMask = vec4(1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0, 0.0);
out vec4 myOutputColor;
void main(void) {
     vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);
     rgbaDepth -= rgbaDepth.gbaa * bitMask;
     myOutputColor = rgbaDepth;
}