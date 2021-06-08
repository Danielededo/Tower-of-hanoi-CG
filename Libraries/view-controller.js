// UI helper arrays

UIonOff = {
	LAlightType:{
		none:{
			LA13:false, LA14:false,
			LA21:false, LA22:false, LA23:false, LA24:false,
			LA31:false, LA32:false, LA33:false, LA34:false,
			LA41:false, LA42:false, LA43:false, LA44:false,
			LA51:false, LA52:false, LA53:false, LA54:false,
			LA61:false, LA62:false
		},
		direct:{
			LA13:true, LA14:true,
			LA21:false, LA22:false, LA23:false, LA24:false,
			LA31:false, LA32:false, LA33:false, LA34:false,
			LA41:false, LA42:false, LA43:false, LA44:false,
			LA51:true, LA52:true, LA53:false, LA54:false,
			LA61:true, LA62:true
		},
		point:{
			LA13:true, LA14:true,
			LA21:true, LA22:true, LA23:true, LA24:true,
			LA31:true, LA32:true, LA33:true, LA34:true,
			LA41:true, LA42:true, LA43:false, LA44:false,
			LA51:false, LA52:false, LA53:false, LA54:false,
			LA61:false, LA62:false
		},
		spot:{
			LA13:true, LA14:true,
			LA21:true, LA22:true, LA23:true, LA24:true,
			LA31:true, LA32:true, LA33:true, LA34:true,
			LA41:true, LA42:true, LA43:true, LA44:true,
			LA51:true, LA52:true, LA53:true, LA54:true,
			LA61:true, LA62:true
		}
	},
	LBlightType:{
		none:{
			LB13:false, LB14:false,
			LB21:false, LB22:false, LB23:false, LB24:false,
			LB31:false, LB32:false, LB33:false, LB34:false,
			LB41:false, LB42:false, LB43:false, LB44:false,
			LB51:false, LB52:false, LB53:false, LB54:false,
			LB61:false, LB62:false
		},
		direct:{
			LB13:true, LB14:true,
			LB21:false, LB22:false, LB23:false, LB24:false,
			LB31:false, LB32:false, LB33:false, LB34:false,
			LB41:false, LB42:false, LB43:false, LB44:false,
			LB51:true, LB52:true, LB53:false, LB54:false,
			LB61:true, LB62:true
		},
		point:{
			LB13:true, LB14:true,
			LB21:true, LB22:true, LB23:true, LB24:true,
			LB31:true, LB32:true, LB33:true, LB34:true,
			LB41:true, LB42:true, LB43:false, LB44:false,
			LB51:false, LB52:false, LB53:false, LB54:false,
			LB61:false, LB62:false
		},
		spot:{
			LB13:true, LB14:true,
			LB21:true, LB22:true, LB23:true, LB24:true,
			LB31:true, LB32:true, LB33:true, LB34:true,
			LB41:true, LB42:true, LB43:true, LB44:true,
			LB51:true, LB52:true, LB53:true, LB54:true,
			LB61:true, LB62:true
		}
	},
	LClightType:{
		none:{
			LC13:false, LC14:false,
			LC21:false, LC22:false, LC23:false, LC24:false,
			LC31:false, LC32:false, LC33:false, LC34:false,
			LC41:false, LC42:false, LC43:false, LC44:false,
			LC51:false, LC52:false, LC53:false, LC54:false,
			LC61:false, LC62:false
		},
		direct:{
			LC13:true, LC14:true,
			LC21:false, LC22:false, LC23:false, LC24:false,
			LC31:false, LC32:false, LC33:false, LC34:false,
			LC41:false, LC42:false, LC43:false, LC44:false,
			LC51:true, LC52:true, LC53:false, LC54:false,
			LC61:true, LC62:true
		},
		point:{
			LC13:true, LC14:true,
			LC21:true, LC22:true, LC23:true, LC24:true,
			LC31:true, LC32:true, LC33:true, LC34:true,
			LC41:true, LC42:true, LC43:false, LC44:false,
			LC51:false, LC52:false, LC53:false, LC54:false,
			LC61:false, LC62:false
		},
		spot:{
			LC13:true, LC14:true,
			LC21:true, LC22:true, LC23:true, LC24:true,
			LC31:true, LC32:true, LC33:true, LC34:true,
			LC41:true, LC42:true, LC43:true, LC44:true,
			LC51:true, LC52:true, LC53:true, LC54:true,
			LC61:true, LC62:true
		}
	},
	diffuseType:{
		none:{
			D21:false, D22:false,
			D41:false, D42:false
		},
		lambert:{
			D21:true,  D22:true,
			D41:false, D42:false
		},
		toon:{
			D21:true,  D22:true,
			D41:true, D42:true
		}
	},
	specularType:{
		none:{
			S21:false, S22:false,
			S31:false, S32:false,
			S41:false, S42:false
		},
		phong:{
			S21:true, S22:true,
			S31:true, S32:true,
			S41:false, S42:false
		},
		blinn:{
			S21:true, S22:true,
			S31:true, S32:true,
			S41:false, S42:false
		},
		toonP:{
			S21:true, S22:true,
			S31:false, S32:false,
			S41:true, S42:true
		},
		toonB:{
			S21:true, S22:true,
			S31:false, S32:false,
			S41:true, S42:true
		}
	}
}


function showHideUI(tag, sel) {
	for(var name in UIonOff[tag][sel]) {
		document.getElementById(name).style.display = UIonOff[tag][sel][name] ? "block" : "none";
	}
}

function showLight(sel) {
	document.getElementById("LA").style.display = (sel == "LA") ? "block" : "none";
	document.getElementById("LB").style.display = (sel == "LB") ? "block" : "none";
	document.getElementById("LC").style.display = (sel == "LC") ? "block" : "none";
}

defShaderParams = {
	computeGeometricalNormals: "false",
	useNormalMaps: "true",

	diffuseType: "lambert",
	specularType: "phong",
	diffuseColor: "#ffffff",
	specularColor: "#ffffff",

	LAlightType: "direct",
	LAlightColor: "#ffffff",
	LAPosX: 20,
	LAPosY: 30,
	LAPosZ: 50,
	LADirTheta: 60,
	LADirPhi: -3,
	LAConeOut: 30,
	LAConeIn: 80,
	LADecay: 0,
	LATarget: 61,

	LBlightType: "none",
	LBlightColor: "#ffffff",
	LBPosX: -24,
	LBPosY: 19,
	LBPosZ: 61,
	LBDirTheta: 73,
	LBDirPhi: -11,
	LBConeOut: 30,
	LBConeIn: 80,
	LBDecay: 0,
	LBTarget: 61,

	LClightType: "none",
	LClightColor: "#ffffff",
	LCPosX: -15,
	LCPosY: 23,
	LCPosZ: 60,
	LCDirTheta: 60,
	LCDirPhi: -20,
	LCConeOut: 30,
	LCConeIn: 80,
	LCDecay: 0,
	LCTarget: 61,

	DTexMix: 100,
	SpecShine: 100,
	DToonTh: 50,
	SToonTh: 90
}

function resetShaderParams() {
	for(var name in defShaderParams) {
		value = defShaderParams[name];
		element = document.getElementById(name)
		
		element.value = value;
		if(element.type == "select-one") {
			showHideUI(name, value);
		}

		if(element.type == "checkbox") {
			element.checked = value == true.toString();
		}
	}
}

function unifPar(pHTML, pGLSL, type) {
	this.pHTML = pHTML;
	this.pGLSL = pGLSL;
	this.type = type;
}

function noAutoSet(uniforms) {
}

function val(uniforms) {
	Reflect.set(uniforms, this.pGLSL, document.getElementById(this.pHTML).value);
}

function valD10(uniforms) {
	Reflect.set(uniforms, this.pGLSL, document.getElementById(this.pHTML).value / 10.0);
}

function valD100(uniforms) {
	Reflect.set(uniforms, this.pGLSL, document.getElementById(this.pHTML).value / 100.0);
}

function valCol(uniforms) {
	col = document.getElementById(this.pHTML).value.substring(1,7);
	R = parseInt(col.substring(0,2) ,16) / 255.0;
	G = parseInt(col.substring(2,4) ,16) / 255.0;
	B = parseInt(col.substring(4,6) ,16) / 255.0;
	Reflect.set(uniforms, this.pGLSL, [R, G, B, 1.0]);
}

function valVec3(uniforms) {
	x = document.getElementById(this.pHTML+"X").value / 10;
	y = document.getElementById(this.pHTML+"Y").value / 10;
	z = document.getElementById(this.pHTML+"Z").value / 10;
	Reflect.set(uniforms, this.pGLSL, [x, y, z]);
}

function valDir(uniforms) {
	var t = degToRad(document.getElementById(this.pHTML+"Theta").value);
	var p = degToRad(document.getElementById(this.pHTML+"Phi").value);
	Reflect.set(uniforms, this.pGLSL, [Math.sin(t)*Math.sin(p), Math.cos(t), Math.sin(t)*Math.cos(p)]);
}

valTypeDecoder = {
	LAlightType:{
		none: [0,0,0,0],
		direct: [1,0,0,0],
		point: [0,1,0,0],
		spot: [0,0,1,0]
	},
	LBlightType:{
		none: [0,0,0,0],
		direct: [1,0,0,0],
		point: [0,1,0,0],
		spot: [0,0,1,0]
	},
	LClightType:{
		none: [0,0,0,0],
		direct: [1,0,0,0],
		point: [0,1,0,0],
		spot: [0,0,1,0]
	},
	ambientType:{
		none: [0,0,0,0],
		ambient: [1,0,0,0],
		hemispheric: [0,1,0,0]
	},
	diffuseType:{
		none: [0,0,0,0],
		lambert: [1,0,0,0],
		toon: [0,1,0,0]
	},
	specularType:{
		none: [0,0,0,0],
		phong: [1,0,0,0],
		blinn: [0,1,0,0],
		toonP: [0,0,1,0],
		toonB: [0,0,0,1]
	},
	computeGeometricalNormals:{
		true: [1, 0],
		false: [0, 1]
	},
	useNormalMaps:{
		true: [1, 0],
		false: [0, 1]
	}
}

function valType(uniforms) {
	var v = valTypeDecoder[this.pHTML][document.getElementById(this.pHTML).value];
	Reflect.set(uniforms, this.pGLSL, [v[0], v[1], v[2], v[3]]);
}

function valChecked(uniforms) {
	var v = valTypeDecoder[this.pHTML][document.getElementById(this.pHTML).checked];
	Reflect.set(uniforms, this.pGLSL, [v[0], v[1]]);
}


unifParArray =[
	new unifPar("diffuseType","u_diffuseType", valType),
	new unifPar("specularType","u_specularType", valType),
	new unifPar("computeGeometricalNormals", "u_computeGeometricalNormals", valChecked),
	new unifPar("useNormalMaps", "u_useNormalMaps", valChecked),

	new unifPar("LAlightType","u_LAlightType", valType),
	new unifPar("LAPos","u_LAPos", valVec3),
	new unifPar("LADir","u_LADir", valDir),
	new unifPar("LAConeOut","u_LAConeOut", val),
	new unifPar("LAConeIn","u_LAConeIn", valD100),
	new unifPar("LADecay","u_LADecay", val),
	new unifPar("LATarget","u_LATarget", valD10),
	new unifPar("LAlightColor","u_LAlightColor", valCol),

	new unifPar("LBlightType","u_LBlightType", valType),
	new unifPar("LBPos","u_LBPos", valVec3),
	new unifPar("LBDir","u_LBDir", valDir),
	new unifPar("LBConeOut","u_LBConeOut", val),
	new unifPar("LBConeIn","u_LBConeIn", valD100),
	new unifPar("LBDecay","u_LBDecay", val),
	new unifPar("LBTarget","u_LBTarget", valD10),
	new unifPar("LBlightColor","u_LBlightColor", valCol),

	new unifPar("LClightType","u_LClightType", valType),
	new unifPar("LCPos","u_LCPos", valVec3),
	new unifPar("LCDir","u_LCDir", valDir),
	new unifPar("LCConeOut","u_LCConeOut", val),
	new unifPar("LCConeIn","u_LCConeIn", valD100),
	new unifPar("LCDecay","u_LCDecay", val),
	new unifPar("LCTarget","u_LCTarget", valD10),
	new unifPar("LClightColor","u_LClightColor", valCol),

	new unifPar("diffuseColor","u_diffuseColor", valCol),
	new unifPar("DTexMix","u_DTexMix", valD100),
	new unifPar("specularColor","u_specularColor", valCol),
	new unifPar("SpecShine","u_SpecShine", val),
	new unifPar("DToonTh","u_DToonTh", valD100),
	new unifPar("SToonTh","u_SToonTh", valD100),
	new unifPar("","u_texture", noAutoSet),
	new unifPar("","pMatrix", noAutoSet),
	new unifPar("","wMatrix", noAutoSet),
	new unifPar("","u_eyePos", noAutoSet)
];

function setupLightsUniforms(uniforms) {
	for(var i = 0; i < unifParArray.length; i++) {
		unifParArray[i].type(uniforms);
	}
}

var keyFunctionDown =function(e) {
	switch(e.keyCode) {
	case 37:
	//console.log("KeyUp   - Dir LEFT");
		eye[0] -= 0.01;
		break;
	case 39:
	//console.log("KeyUp   - Dir RIGHT");
		eye[0] += 0.01;
		break;
	case 38:
	//console.log("KeyUp   - Dir UP");
		eye[1] += 0.01;
		break;
	case 40:
	//console.log("KeyUp   - Dir DOWN");
		eye[1] -= 0.01;
		break;
	case 173:
	// KeyUp +
		eye[2] += 0.01;
		break;
	case 171:
	// KeyUp -
		eye[2] -= 0.01;
		break;
	}
}