"use strict";

twgl.setDefaults({attribPrefix: "a_"});
let gl, textureProgramInfo, colorProgramInfo;
let baseDir, shaderDir;

const bodyPath = 'model/body/Cat_body_norm.obj';
const eyePath = 'model/pieces/eye_norm.obj';
const minutesClockhandPath = 'model/pieces/minutesClockhand.obj';
const hoursClockhandPath = 'model/pieces/hoursClockhand.obj';
const tailPath = 'model/pieces/tail.obj';

let obj = [];
let objectUniforms = [];
let drawObjects = [];

let frameCounter = 0;
let invertRotation = false;

let clockHand1LocalMatrix = makeLocalMatrix(0.0, 0.0, 0.0001, 0.0, 0.0, 0.0, 2.0); // tz previously set to 0.029
let clockHand2LocalMatrix = makeLocalMatrix(0.0, 0.0, 0.0001, 0.0, 0.0, 0.0, 2.0); // tz previously set to 0.028
let leftEyeLocalMatrix = makeLocalMatrix(-0.00799, 0.0475, 0.0195, 0.0,0.0,0.0,2.0);
let rightEyeLocalMatrix = makeLocalMatrix(0.00799, 0.0475, 0.0195, 0.0,0.0,0.0,2.0);
let tailLocalMatrix = makeLocalMatrix(-0.005182, -0.014557, 0.012112, 0.0,0.0,0.0,2.0);
const bodyLocalMatrix = makeLocalMatrix(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0);

// Vector and matrixes used in drawScene() to compute the worldViewProjectionMatrix
const eye = [0.0, 0.05, 0.2];
const target = [0.0, 0.0, 0.0];
const up = [0.0, 1.0, 0.0]; //a vector pointing up 

/**
 * Performs matrix manipulations and animations of the scene to be drawn.
 *
 * The handclocks rotation (in degrees) is calculated on the current time,
 * while the tail and eyes rotation relies on the fact that window.requestAnimationFrame
 * is called 60 times per second (https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
 * therefore in 60fps the tail and eyes will have 15 frames to move in a direction, 15f to
 * return to the centre and again (15+15)frames in the opposite direction, resulting
 * in a 60frames (== 1 second) movement. 
 * The resulting rotation is (delta * 15) degrees (e.g. delta = 1 means 15° rotation of eyes and tail)
 */
function animate() {
	frameCounter += 1;

	// Clockhands rotations based on time
	let date = new Date();
	let hour_24 = date.getHours();
	let hour = hour_24 < 12 ? hour_24 : hour_24 - 12;
	let minutes = date.getMinutes();

	let hoursRotationMatrix = m4.rotateZ(clockHand1LocalMatrix, -(hour + minutes/60.0) * 2 * Math.PI/12.0);
	let minutesRotationMatrix = m4.rotateZ(clockHand2LocalMatrix, -minutes * 2 * Math.PI/60.0);
	drawObjects[4].localMatrix = hoursRotationMatrix;
	drawObjects[5].localMatrix = minutesRotationMatrix;
		/**
		 * The block above could be rewritten in a short form as:
		 * 
		 *  m4.rotationZ(-(hour + minutes/60.0) * 2 * Math.PI/12.0, clockHand1LocalMatrix);
		 *  m4.rotationZ(-minutes * 2 * Math.PI/60.0, clockHand2LocalMatrix)
		 * 
		 * but in this case I should translate and scale the two matrixes, 
		 * resulting in (2*rot + 2*tr + 2*sc) = 6 instructions vs. 4 in the actual block
		 */
	// End clockhands rotation

	// Tail and eyes rotation
	const delta = 1; // 1 degree each frame
	if (!invertRotation) {
		m4.rotateZ(tailLocalMatrix, delta * Math.PI / 180, tailLocalMatrix);
		m4.rotateY(leftEyeLocalMatrix, delta * Math.PI / 180, leftEyeLocalMatrix);
		m4.rotateY(rightEyeLocalMatrix, delta * Math.PI / 180, rightEyeLocalMatrix);
	} else {
		m4.rotateZ(tailLocalMatrix, -delta * Math.PI / 180, tailLocalMatrix);
		m4.rotateY(leftEyeLocalMatrix, -delta * Math.PI / 180, leftEyeLocalMatrix);
		m4.rotateY(rightEyeLocalMatrix, -delta * Math.PI / 180, rightEyeLocalMatrix);
	}

	invertRotation = frameCounter == 15 ? !invertRotation : invertRotation;
	frameCounter = frameCounter == 30 ? 0 : frameCounter
	// End tail and eyes rotation
}

/**
 * This method is responsible for drawing the scene and calling itself for
 * each frame of the animation. The projection matrix is computed at each frame
 * to enable the resizeability of the window.
 * 
 * @param {number} time - Milliseconds from the first call
 */
function drawScene(time) {
	twgl.resizeCanvasToDisplaySize(gl.canvas); // Resize a canvas to match the size it's displayed.
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // Tell WebGL how to convert from clip space to pixels
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	let projectionMatrix = m4.perspective(90 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.001, 100);

	animate();

	const camera = m4.lookAt(eye, target, up);
	const viewMatrix = m4.inverse(camera);

	drawObjects.forEach(function(obj) {
		const programInfo = obj.programInfo;
		let worldViewMatrix = m4.multiply(viewMatrix, obj.localMatrix);
		let worldViewProjectionMatrix = m4.multiply(projectionMatrix, worldViewMatrix);
		obj.uniforms.u_worldViewProjection = worldViewProjectionMatrix;
		obj.uniforms.u_vertexMatrix = obj.localMatrix;
		obj.uniforms.u_normalMatrix = m4.inverse(m4.transpose(obj.localMatrix));

		obj.uniforms.u_eyePos = eye;
		
		setupLightsUniforms(obj.uniforms);

		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, obj.bufferInfo); // binds buffers and sets attributes
		twgl.setUniforms(programInfo, obj.uniforms);
		twgl.drawBufferInfo(gl, obj.bufferInfo);
	})

	window.requestAnimationFrame(drawScene);
}

/**
 * Settings for the different components to be drawn.
 * For each object it sets the uniforms (color and position), their
 * local matrix, VAO and program info of the program that will draw them.
 */
function main() {
	const black = [0.0, 0.0, 0.0, 1.0];
	const white = [1.0, 1.0, 1.0, 1.0];

	twgl.resizeCanvasToDisplaySize(gl.canvas);
	// Tell WebGL how to convert from clip space to pixels
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const textures = twgl.createTextures(gl, {
		color: {
			src: "textures/KitCat_color.png",
			flipY: true
		},
		normalMap: {
			src: "textures/kitcat_NM.png",
			flipY: true
		}
	}, () => {
		setupObjects();
		window.requestAnimationFrame(drawScene);
	});

	/**
	 * Inner function used to setup objects after 
	 * the textures have been loaded and created.
	 *
	 * This will set the buffers and uniforms of each
	 * object, setting tail and clockhands with specific colors
	 * and the rest of the objects with their textures.
	 */
	function setupObjects() {
		obj.forEach( (object, index) => {
			// 0 = tail, 1 = leftEye, 2 = rightEye, 3 = body, 4 = hoursClockhand, 5 = minuteClockhand
			let uniforms = {};
			let arrays = {
				position: object.getVertices(),
				normal: object.getNormals(),
				texcoord: object.getTextures(),
				indices: object.getIndices()
			};
			// creating buffers and attribute settings
			let objBuffInfo = twgl.createBufferInfoFromArrays(gl, arrays);
			let programInfo = object.getProgramInfo();
				
			switch(index) {
				case 0: // tail
					uniforms.u_color = black;
					break;
				case 4:
				case 5: //clockhands
					uniforms.u_color = white;
					break;
				default:
					uniforms.u_texture = textures.color;
					uniforms.u_normalMap = textures.normalMap;
					break;
			}

			uniforms.u_eyePos = eye;

			drawObjects.push({
				programInfo: programInfo,
				bufferInfo: objBuffInfo,
				uniforms: uniforms,
				localMatrix: object.getLocalMatrix()
			});
		});
	}
}

/**
 * Compiles the shaders and creates their setters
 * for attributes and uniforms, and loads the 3D
 * models of objects to be drawn.
 */
async function init(){
	// retrieve shader using path
	var path = window.location.pathname;
	var page = path.split("/").pop();
	baseDir = window.location.href.replace(page, '');
	shaderDir = baseDir + "shaders/";

	// create canvas
	var canvas = document.getElementById("c");
	gl = canvas.getContext("webgl2");
	console.log(gl);
	if (!gl) {
		document.write("GL context not opened");
		return;
	}
	
	// Loading the shaders and creating programs
	await utils.loadFiles([shaderDir + 'texture_vs.vert', shaderDir + 'texture_fs.frag'], function (shaderText) {
		// compiles a shader and creates setters for attribs and uniforms
		textureProgramInfo = twgl.createProgramInfo(gl, [shaderText[0], shaderText[1]], ["a_position", "a_texcoord", "a_normal"]);
	});
	await utils.loadFiles([shaderDir + 'color_vs.vert', shaderDir + 'color_fs.frag'], function (shaderText) {
		// compiles a shader and creates setters for attribs and uniforms
		colorProgramInfo = twgl.createProgramInfo(gl, [shaderText[0], shaderText[1]], ["a_position", "a_normal"]);
	});

	/*
	* Loading the obj models
	*/
	let tailWrapper = new ObjectWrapper(baseDir + tailPath);
	let bodyWrapper = new ObjectWrapper(baseDir + bodyPath);
	let leftEyeWrapper = new ObjectWrapper(baseDir + eyePath);
	let rightEyeWrapper = new ObjectWrapper(baseDir + eyePath);
	let hoursClockhandWrapper = new ObjectWrapper(baseDir + hoursClockhandPath);
	let minutesClockhandWrapper = new ObjectWrapper(baseDir + minutesClockhandPath);
	// Set the local matrix for each object and the program to draw them
	tailWrapper.setLocalMatrix(tailLocalMatrix).setProgramInfo(colorProgramInfo);
	bodyWrapper.setLocalMatrix(bodyLocalMatrix).setProgramInfo(textureProgramInfo);
	leftEyeWrapper.setLocalMatrix(leftEyeLocalMatrix).setProgramInfo(textureProgramInfo);
	rightEyeWrapper.setLocalMatrix(rightEyeLocalMatrix).setProgramInfo(textureProgramInfo);
	hoursClockhandWrapper.setLocalMatrix(clockHand2LocalMatrix).setProgramInfo(colorProgramInfo);
	minutesClockhandWrapper.setLocalMatrix(clockHand1LocalMatrix).setProgramInfo(colorProgramInfo);

	// Save each object wrapper in a unique array of objects to draw
	obj = [tailWrapper, leftEyeWrapper, rightEyeWrapper, bodyWrapper, hoursClockhandWrapper, minutesClockhandWrapper];

	obj.forEach(async (wrapper) => { await wrapper.loadModel(); });

	window.addEventListener("keydown", keyFunctionDown, false);

	resetShaderParams();
	main();
}

window.onload = init;