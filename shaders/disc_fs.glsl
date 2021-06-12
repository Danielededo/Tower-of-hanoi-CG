#version 300 es

precision highp float;

uniform vec3 uColor; // the object's color
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform vec3 uEye;
in vec3 fNormal;
in vec3 fPosition;
out vec4 myOutputColor;

// Light direction:
// uLightDirection

// Light color:
// uLightColor

// Diffuse computation
vec4 compDiffuse(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec4 diffColor){
    float LdotN = max(0.0, dot(normalVec, lightDir));
	vec4 LDcol = lightCol * diffColor;
    // Lambert
    vec4 diffuseLambert = LDcol * LdotN;

    return diffuseLambert;
}

vec4 compSpecular(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec3 eyedirVec) {
    vec4 specularColor = vec4(1.0, 1.0, 1.0, 1.0);
    vec3 reflection = -reflect(lightDir, normalVec);
    float LdotN = max(0.0, dot(normalVec, lightDir));
    float LdotR = max(dot(reflection, eyedirVec), 0.0);
    vec3 halfVec = normalize(lightDir + eyedirVec);
	float HdotN = max(dot(normalVec, halfVec), 0.0);
    float SpecShine = 100.0; // fix
    float SToonTh = 90.0;
    vec4 LScol = lightCol * specularColor * max(sign(LdotN),0.0);
    
    // Blinn
    vec4 specularBlinn = LScol * pow(HdotN, SpecShine);
    // Toon Blinn
	vec4 specularToonB = max(sign(HdotN - SToonTh), 0.0) * LScol;

    // Phong
    vec4 specularPhong = LScol * pow(LdotR, SpecShine);
    // Toon Phong
	vec4 specularToonP = max(sign(LdotR - SToonTh), 0.0) * LScol;

	return specularBlinn;
}

vec4 compAmbient(vec4 ambColor) {
	vec4 ambientLightColor = vec4(1.0, 1.0, 1.0, 1.0);
    // Ambient
	vec4 ambientAmbient = ambientLightColor * ambColor;

	return ambientAmbient;
}


void main() {

    vec4 lightCol = vec4(uLightColor,1.0);
    vec4 diffColor = vec4(0.5, 0.5, 0.5, 1.0);
    vec4 ambColor = vec4(uColor, 1.0);
    vec3 normalVec = normalize(fNormal);
    vec3 eyedirVec = normalize(uEye - fPosition);

    // diffuse
    vec4 diffuse = compDiffuse(uLightDirection, lightCol, normalVec, diffColor);

    // specular
    vec4 specular = compSpecular(uLightDirection, lightCol, normalVec, eyedirVec);

    // ambient
    vec4 ambient = compAmbient(ambColor);

    vec4 out_color = clamp(ambient + diffuse + specular, 0.0, 1.0);
    myOutputColor = vec4(out_color.rgb, 1.0);
}