#version 300 es
precision mediump float;

in vec3 fs_pos;
in vec3 fs_norm;
out vec4 outColor;

uniform vec4 u_color;

uniform vec3 u_eyePos;

uniform vec4 u_diffuseType;
uniform vec4 u_specularType;

uniform vec4 u_LAlightType;
uniform vec3 u_LAPos;
uniform vec3 u_LADir;
uniform float u_LAConeOut;
uniform float u_LAConeIn;
uniform float u_LADecay;
uniform float u_LATarget;
uniform vec4 u_LAlightColor;

uniform vec4 u_LBlightType;
uniform vec3 u_LBPos;
uniform vec3 u_LBDir;
uniform float u_LBConeOut;
uniform float u_LBConeIn;
uniform float u_LBDecay;
uniform float u_LBTarget;
uniform vec4 u_LBlightColor;

uniform vec4 u_LClightType;
uniform vec3 u_LCPos;
uniform vec3 u_LCDir;
uniform float u_LCConeOut;
uniform float u_LCConeIn;
uniform float u_LCDecay;
uniform float u_LCTarget;
uniform vec4 u_LClightColor;

uniform vec4 u_diffuseColor;
uniform float u_DTexMix;
uniform vec4 u_specularColor;
uniform float u_SpecShine;
uniform float u_DToonTh;
uniform float u_SToonTh;

vec3 compLightDir(vec3 LPos, vec3 LDir, vec4 lightType) {
	//lights
	// -> Point
	// Point lights emit light from fixed points in the space and direction
	// varies depending on the point x of the object it is illuminating
	vec3 pointLightDir = normalize(LPos - fs_pos);
	// -> Direct
	// Direct lights can be specified with a constant vector
	// and are independent of the position x on the object
	vec3 directLightDir = LDir;
	// -> Spot
	// Spot lights are conic sources characterized
	// by a direction d and a position 
	vec3 spotLightDir = normalize(LPos - fs_pos);

	return  directLightDir * lightType.x +
			pointLightDir * lightType.y +
			spotLightDir * lightType.z;
}

vec4 compLightColor(vec4 lightColor, float LTarget, float LDecay, vec3 LPos, vec3 LDir,
					float LConeOut, float LConeIn, vec4 lightType) {
	float LCosOut = cos(radians(LConeOut / 2.0));
	float LCosIn = cos(radians(LConeOut * LConeIn / 2.0));

	//lights
	// -> Point
	vec4 pointLightCol = lightColor * pow(LTarget / length(LPos - fs_pos), LDecay);
	// -> Direct
	vec4 directLightCol = lightColor;
	// -> Spot
	vec3 spotLightDir = normalize(LPos - fs_pos);
	float CosAngle = dot(spotLightDir, LDir);
	vec4 spotLightCol = lightColor * pow(LTarget / length(LPos - fs_pos), LDecay) *
						clamp((CosAngle - LCosOut) / (LCosIn - LCosOut), 0.0, 1.0);
	// ----> Select final component
	return  directLightCol * lightType.x +
			pointLightCol * lightType.y +
			spotLightCol * lightType.z;
}

vec4 compDiffuse(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec4 diffColor) {
	// Diffuse
	// --> Lambert
	// Each point of an object hit by a ray of light, reflects
	// it with uniform probability in all the direction.
	// The quantity of light received by an object, depends 
	// on the angle between the ray of light and reflecting surface
	vec4 diffuseLambert = lightCol * clamp(dot(normalVec, lightDir),0.0,1.0) * diffColor;
	// --> Toon
	// Toon shading simplifies the output color range, using 
	// only discrete values according to a set of thresholds.
	// It starts from a standard Lambert BRDF for the diffuse
	// then it uses two colors and a threshold for determining
	// which one to choose.
	vec4 ToonCol;
	if(dot(normalVec, lightDir) > u_DToonTh) {
		ToonCol = diffColor;
	} else {
		ToonCol = vec4(0.0, 0.0, 0.0, 1.0);
	}
	vec4 diffuseToon = lightCol * ToonCol;
	// ----> Select final component
	return diffuseLambert * u_diffuseType.x + diffuseToon * u_diffuseType.y;
}

vec4 compSpecular(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec3 eyedirVec) {
	// Specular
	// --> Phong
	// In the Phong model, the specular reflection has the same angle 
	// as the incoming ray with respect to the normal vector, but it 
	// is oriented in the opposite direction, and it is positioned on 
	// the same plane as the light and the normal vectors
	vec3 reflection = -reflect(lightDir, normalVec);
	vec4 specularPhong = lightCol * pow(max(dot(reflection, eyedirVec), 0.0), u_SpecShine) * u_specularColor;
	// --> Blinn
	// The Blinn reflection model is an alternative to the Phong 
	// shading model that uses the  half vector h
	vec3 halfVec = normalize(lightDir + eyedirVec);
	vec4 specularBlinn = lightCol * pow(max(dot(normalVec, halfVec), 0.0), u_SpecShine) * u_specularColor;
	// --> Toon Phong
	// It starts from a standard Phong or Blinn BRDF with gamma=1
	// then it uses two colors and a threshold for determining
	// which one to choose.
	vec4 ToonSpecPCol;
	if(dot(reflection, eyedirVec) > u_SToonTh) {
		ToonSpecPCol = u_specularColor;
	} else {
		ToonSpecPCol = vec4(0.0, 0.0, 0.0, 1.0);
	}
	vec4 specularToonP = lightCol * ToonSpecPCol;
	// --> Toon Blinn
	vec4 ToonSpecBCol;
	if(dot(normalVec, halfVec) > u_SToonTh) {
		ToonSpecBCol = u_specularColor;
	} else {
		ToonSpecBCol = vec4(0.0, 0.0, 0.0, 1.0);
	}
	vec4 specularToonB = lightCol * ToonSpecBCol;
	// ----> Select final component
	return  specularPhong * u_specularType.x +
			specularBlinn * u_specularType.y +
			specularToonP * u_specularType.z +
			specularToonB * u_specularType.w;
}

void main() {
    vec3 normalVec = normalize(fs_norm);
    vec3 eyeDirVec = normalize(u_eyePos - fs_pos);

    vec4 diffColor = u_diffuseColor * (1.0-u_DTexMix) + u_color * u_DTexMix;

    //lights
	vec3 LAlightDir = compLightDir(u_LAPos, u_LADir, u_LAlightType);
	vec4 LAlightCol = compLightColor(u_LAlightColor, u_LATarget, u_LADecay, u_LAPos, u_LADir,
								     u_LAConeOut, u_LAConeIn, u_LAlightType);
	
	vec3 LBlightDir = compLightDir(u_LBPos, u_LBDir, u_LBlightType);
	vec4 LBlightCol = compLightColor(u_LBlightColor, u_LBTarget, u_LBDecay, u_LBPos, u_LBDir,
								     u_LBConeOut, u_LBConeIn, u_LBlightType);
	
	vec3 LClightDir = compLightDir(u_LCPos, u_LCDir, u_LClightType);
	vec4 LClightCol = compLightColor(u_LClightColor, u_LCTarget, u_LCDecay, u_LCPos, u_LCDir,
								     u_LCConeOut, u_LCConeIn, u_LClightType);

    // Diffuse
	// The diffuse component of the BRDF represents the main color of the object
	vec4 diffuse =  compDiffuse(LAlightDir, LAlightCol, normalVec, diffColor) + 
				    compDiffuse(LBlightDir, LBlightCol, normalVec, diffColor) +
				    compDiffuse(LClightDir, LClightCol, normalVec, diffColor);

	// Specular
	// Shiny objects tend to reflect the incoming light in a particular angle, 
	// called  the specular direction, which depends on the direction from which 
	// the object is seen omega_r. This effect is implemented in the specular 
	// component of the BRDF.
	vec4 specular = compSpecular(LAlightDir, LAlightCol, normalVec, eyeDirVec) +
			        compSpecular(LBlightDir, LBlightCol, normalVec, eyeDirVec) +
			        compSpecular(LClightDir, LClightCol, normalVec, eyeDirVec);

    outColor = vec4(clamp(diffuse + specular, 0.0, 1.0).rgb, 1.0);
}