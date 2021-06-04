#version 300 es

/**
* we use procedural texture to draw discs
*/
#ifdef GL_ES
    precision highp float;
#endif

uniform vec3 uColor; // the object's color
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
in vec3 fNormal;
in vec3 fPosition;
in vec3 uPosition;
out vec4 myOutputColor;

/**
* compute the Blinn-Phong shading model
* @param lightDirection: the direction of the light in camera coordinate
* @param lightIntensity: the intensity of the light
* @param ambientCoefficient: the coefficient of ambient light
* @param diffuseCoefficient: the coefficient of diffuse light
* @param specularCoefficient: the coefficient of specular light
* @param specularExponent: the lightiness of specular light
* @return a 2D vector whose first element is the combination final coefficient of ambient light and diffuse
* light while the second element is the final coefficient of specular light
*/
vec2 blinnPhongShading(vec3 lightDirection, float lightIntensity, float ambientCoefficient,
    float diffuseCoefficient, float specularCoefficient, float specularExponent)
{
    lightDirection = normalize(lightDirection);
    vec3 eyeDirection = normalize(-fPosition);
    vec3 normal = normalize(fNormal);
    vec3 halfVector = normalize(eyeDirection + lightDirection);
    float ambientAndDiffuse = ambientCoefficient + diffuseCoefficient * lightIntensity * max(0.0, dot(normal,
        lightDirection));
    float specular = specularCoefficient * pow(max(0.0, dot(normal, halfVector)), specularExponent);
    return vec2(ambientAndDiffuse, specular);
}

/**
* compute z-value from a vec4
*/
float unpackDepth(const in vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0, 1.0 / 256.0, 1.0 / (256.0 * 256.0), 1.0 / (256.0 * 256.0 * 256.0));
    float depth = dot(rgbaDepth, bitShift);
    return depth;
}

void main(void) {
    vec2 light = blinnPhongShading(uLightDirection, 1.0, 0.5, 1.0, 1.5, 30.0);
    vec3 objectColor = uColor; // add some stripes
    vec3 ambientAndDiffuseColor = light.x * objectColor;
    vec3 specularColor = light.y * uLightColor;
    myOutputColor = vec4((ambientAndDiffuseColor + specularColor), 1.0);
}