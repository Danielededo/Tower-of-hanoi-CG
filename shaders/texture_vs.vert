#version 300 es

in vec3 a_position;
in vec2 a_texcoord;
in vec3 a_normal;
out vec2 fs_uv;
out vec3 fs_pos;
out vec3 fs_norm;

uniform mat4 u_worldViewProjection;
uniform mat4 u_vertexMatrix;
uniform mat4 u_normalMatrix;

void main() {
	fs_uv = a_texcoord;
	fs_pos = (u_vertexMatrix * vec4(a_position, 1.0)).xyz;
	fs_norm = mat3(u_normalMatrix) * a_normal;
	gl_Position = (u_worldViewProjection * vec4(a_position, 1.0));
}