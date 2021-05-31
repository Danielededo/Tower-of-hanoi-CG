#version 300 es

/**
* we do not use any texture to draw ground
*/
#ifdef GL_ES
    precision highp float;
#endif
uniform vec3 uColor; // the ground's color
uniform vec3 uLightColor;
uniform sampler2D uShadowMap; // depth value in light coordinate
uniform float uShadowMapResolution;
in vec4 vPositionFromLight;
out vec4 myOutputColor;
/**
* compute z-value from a vec4
*/
float unpackDepth(const in vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0, 1.0 / 256.0, 1.0 / (256.0 * 256.0), 1.0 / (256.0 * 256.0 * 256.0));
    float depth = dot(rgbaDepth, bitShift);
    return depth;
}

/**
* compute the visibility coefficient
*/
float getVisibility(vec3 shadowCoordinate) {
    float sum = 0.0;
    // use a simple and incomplete but good enough percentage-closer filtering method.
    // take 16 points on shadow map as the sampler.
    for (float x = -1.5; x <= 1.5; x += 1.0) {
        for (float y = -1.5; y <= 1.5; y += 1.0) {
            if(shadowCoordinate.z > 1.0) {
                // coordinates outside the far plane of the light's orthographic frustum will never be in shadow
                sum += 1.0;
            } else {
                vec2 biasedCoordinate = shadowCoordinate.xy + vec2(x, y) / uShadowMapResolution;
                float depth = 1.0; // all coordinates outside the depth map's range have a default depth of 1.0
                // which means these coordinates will never be in shadow since no object will have a depth larger than 1.0
                if (biasedCoordinate.x >= 0.0 && biasedCoordinate.x <= 1.0 && biasedCoordinate.y >= 0.0 && biasedCoordinate.y <= 1.0) {
                    vec4 rgbaDepth = texture(uShadowMap, biasedCoordinate);
                    depth = unpackDepth(rgbaDepth); // decode the depth value from the depth map
                }
                sum += (shadowCoordinate.z > depth + 0.005) ? 0.5 : 1.0; // add 0.005 to eliminate Mach band, also known as shadow acne
            }
        }
    }
    return sum / 16.0;
}

void main(void) {
    vec3 shadowCoordinate = (vPositionFromLight.xyz / vPositionFromLight.w) / 2.0 + 0.5;
    float visibility = getVisibility(shadowCoordinate);
    vec3 finalColor = clamp((uColor + uLightColor) / 2.0, 0.0, 1.0); // mix the ground's color and the light's color
    myOutputColor = vec4(visibility * finalColor, 1.0);
}