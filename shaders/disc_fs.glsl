#version 300 es

precision highp float;

in vec3 fNormal;
in vec3 fPosition;

uniform vec3 uColor; // the object's color

uniform vec2 uDiffuseType; 
uniform vec3 uSpecularType; 

uniform float uLightConeOut; 
uniform float uLightConeIn; 
uniform float uLightDecay; 
uniform float uLightTarget; 
uniform vec3 uLightType; 
uniform vec3 uLightPosition;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;

uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseColor; 
uniform float uSpecShine; 
uniform float uDToonTh; 
uniform float uSToonTh; 
uniform vec3 uSpecularColor;
uniform vec3 uEye;

out vec4 myOutputColor;

// light direction computation
vec3 compLightDir() {
	//lights
	// -> Point
	vec3 pointLightDir = normalize(uLightPosition - fPosition);
	// -> Direct
	vec3 directLightDir = uLightDirection;
	// -> Spot
	vec3 spotLightDir = normalize(uLightPosition - fPosition);

	return            directLightDir * uLightType.x +
					  pointLightDir * uLightType.y +
					  spotLightDir * uLightType.z;
}

// light color computation
vec4 compLightColor(vec3 lightDir, vec4 lightCol) {
	float lightCosOut = cos(radians(uLightConeOut / 2.0));
	float lightCosIn = cos(radians(uLightConeOut * uLightConeIn / 2.0));

	//lights
	// -> Point
	vec4 pointLightCol = lightCol * pow(uLightTarget / length(uLightPosition - fPosition), uLightDecay);
	// -> Direct
	vec4 directLightCol = lightCol;
	// -> Spot
	vec3 spotLightDir = normalize(uLightPosition - fPosition);
	float CosAngle = dot(spotLightDir, lightDir);
	vec4 spotLightCol = lightCol * pow(uLightTarget / length(uLightPosition - fPosition), uLightDecay) *
						clamp((CosAngle - lightCosOut) / (lightCosIn - lightCosOut), 0.0, 1.0);
	// ----> Select final component
	return          directLightCol * uLightType.x +
					pointLightCol * uLightType.y +
					spotLightCol * uLightType.z;
}

// Diffuse computation
vec4 compDiffuse(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec4 diffColor){

    //Diffuse
    float LdotN = max(0.0, dot(normalVec, lightDir));
	vec4 LDcol = lightCol * diffColor;

    // Lambert
    vec4 diffuseLambert = LDcol * LdotN;

    // --> Toon
	vec4 diffuseToon = max(sign(LdotN- uDToonTh),0.0) * LDcol;

    return         diffuseLambert * uDiffuseType.x +
				   diffuseToon * uDiffuseType.y;
}

// Specular computation
vec4 compSpecular(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec3 eyedirVec, vec4 specularCol) {
    vec3 reflection = -reflect(lightDir, normalVec);
    float LdotN = max(0.0, dot(normalVec, lightDir));
    float LdotR = max(dot(reflection, eyedirVec), 0.0);
    vec3 halfVec = normalize(lightDir + eyedirVec);
	float HdotN = max(dot(normalVec, halfVec), 0.0);
    vec4 LScol = lightCol * specularCol * max(sign(LdotN),0.0);
    
    // Blinn
    vec4 specularBlinn = LScol * pow(HdotN, uSpecShine);
    // Toon Blinn
	vec4 specularToonB = max(sign(HdotN - uSToonTh), 0.0) * LScol;

    // Phong
    vec4 specularPhong = LScol * pow(LdotR, uSpecShine);
    // Toon Phong
	vec4 specularToonP = max(sign(LdotR - uSToonTh), 0.0) * LScol;

	return          specularPhong * uSpecularType.x * (1.0 - uSpecularType.z) +
					specularBlinn * uSpecularType.y * (1.0 - uSpecularType.z)+
					specularToonP * uSpecularType.z * uSpecularType.x +
					specularToonB * uSpecularType.z * uSpecularType.y;
}


// Ambient computation
vec4 compAmbient(vec4 ambientLightColor, vec4 ambMatColor) {
    // Ambient
	vec4 ambientAmbient = ambientLightColor * ambMatColor;

	return ambientAmbient;
}


void main() {

    vec4 lightCol = vec4(uLightColor,1.0);
    vec4 diffColor = vec4(uDiffuseColor, 1.0);
    vec4 ambMatColor = vec4(uColor, 1.0);
    vec4 ambLightCol = vec4(uAmbientLightColor,1.0);
    vec4 specularCol = vec4(uSpecularColor, 1.0);
    vec3 normalVec = normalize(fNormal);
    vec3 eyedirVec = normalize(uEye - fPosition);

    // lights
    vec3 lightDirection = compLightDir();
    vec4 lightColor = compLightColor(lightDirection, lightCol);
	
    // diffuse
    vec4 diffuse = compDiffuse(lightDirection, lightColor, normalVec, diffColor);

    // specular
    vec4 specular = compSpecular(lightDirection, lightColor, normalVec, eyedirVec, specularCol);

    // ambient
    vec4 ambient = compAmbient(ambLightCol, ambMatColor);

    vec4 out_color = clamp(ambient + diffuse + specular, 0.0, 1.0);
    myOutputColor = vec4(out_color.rgb, 1.0);
}