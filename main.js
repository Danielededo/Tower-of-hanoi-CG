/** the main file
 *
 * If you want to adjust the position of camera in world coordinate, the angele of field of view or the position of
 * light in world coordinate, please change numbers in function draw in main.js
 * If you want to adjust the position or the size of rods and discs, or the flying altitude of the moving disc, please
 * modify numbers in function Game in gameLogic.js
 * If you want to speed up the moving disc, please modify variable movingSpeed defined in
 * Game.prototype.updateDiscPosition in gameLogic.js
 *
 * I use some parallel lights, but you can swift to a dot light with a lot of work. I give out a brief instruction in
 * main.js
 *
 * If the animation is too frozen on your computer, please use a smaller number of framebuffer.resolution in
 * allObjects.js at the expense of aliasing of the shadow
 *
*/

//var m4 = twgl.m4; // abbreviation
//var v3 = twgl.v3;
// array of shaderProgram
var allObjects = [];
var shaderProgram = new Array();

var lookRadius = 1.0;
/*var canw;
var EVangle, EVelevation ;
var angle = 0.01;
var elevation = 0.01;
var extView = 1;
var mouseState = false;
var lastMouseX = -100, lastMouseY = -100;
function doMouseDown(event) {
	lastMouseX = event.pageX;
	lastMouseY = event.pageY;
	mouseState = true;
}
function doMouseUp(event) {
	lastMouseX = -100;
	lastMouseY = -100;
	mouseState = false;
}
function doMouseMove(event) {
	if(mouseState) {
	 var dx = event.pageX - lastMouseX;
	var dy = lastMouseY - event.pageY;
	 if((event.pageX <= 0.66 * canw) || (extView == 0)) {		
		if((dx != 0) || (dy != 0)) {
			angle += 0.5 * dx;
			elevation += 0.5 * dy;
		}
	  } else {
		if((dx != 0) || (dy != 0)) {
			EVangle += 0.5 * dx;
			EVelevation += 0.5 * dy;
		}
//		modRot = modRot + 0.5 * dx;
	  }
	  lastMouseX = event.pageX;
	  lastMouseY = event.pageY;
	}
}*/
function doMouseWheel(event) {
	var nLookRadius = lookRadius + event.wheelDelta/1000.0;
	if((nLookRadius > 0.5) && (nLookRadius < 2.0)) {
        console.log(lookRadius);
		lookRadius = nLookRadius;
	}
}


async function init() {

    // create canvas
    var canvas = document.getElementById("my-canvas");
    //canvas.addEventListener("mousedown", doMouseDown, false);
	//canvas.addEventListener("mouseup", doMouseUp, false);
	//canvas.addEventListener("mousemove", doMouseMove, false);
    canvas.addEventListener("mousewheel", doMouseWheel, false);
    var gl = canvas.getContext('webgl2'); // gl should not be a global variable and it should be wrapped in object
    // drawingState defined in allObjects.js so that you could draw many animations on one web page.
    if (!gl) {
        document.write('Your browser does not support WebGL, please use another browser.');
        return;
    }

    // start a new game
    var game = new Game();

    // make a fake drawing state for the object initialization
    var drawingState = {
        gl : gl
    }

    // retrieve shaders using path
    var path = window.location.pathname;
    var page = path.split("/").pop();
    var baseDir = window.location.href.replace(page, '');
    var shaderDir = baseDir + "Shaders/";

    //compile the shaders for rod 
    await utils.loadFiles([shaderDir + 'rod_vs.glsl', shaderDir + 'rod_fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        shaderProgram[0] = utils.createProgram(gl, vertexShader, fragmentShader);
        });

    // compile the shaders for disc
    await utils.loadFiles([shaderDir + 'disc_vs.glsl', shaderDir + 'disc_fs.glsl'], function (shaderText) {
        var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
        var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
        shaderProgram[1] = utils.createProgram(gl, vertexShader, fragmentShader);
        });
    

    for (var i = 0; i < game.getNumberOfRods(); i++){
        allObjects.push(game.rods[i]); //push the rods
    }
    for (i = 0; i < game.getNumberOfRods(); i++){
        for (var j = 0; j < game.rods[i].getNumberOfDiscs(); j++){
            allObjects.push(game.rods[i].stackOfDiscs[j]); // push the discs
        }
    }
    allObjects.forEach(
        function(object){
            object.initialize(drawingState);
    });
    // compile the shader program for shadow
    //compileShadowProgram(drawingState); // use drawingState.gl

    // create a frame buffer object for shadow
    //var framebuffer = createFramebufferForShadow(drawingState); // use drawingState.gl

    var ab; // for arcball

    var realTime = performance.now(); // the returned value represents the time elapsed since the time origin.

    var frameIndex = 0;
    var frameCount = 10; // only use 10 frames (the second frame to the eleventh frame) to compute user's fps
    var startTimestamp; // for computing user's fps

    var fps = 60; // fps = 60 Hz (updated soon after the first 10 frames)

    /**
     * the main drawing function
     TODO: change numbers to get WORLD 
    */
    function draw() {

        // since we have drawn the first frame now, the web page must have the focus
        if (frameIndex == 1) {
            startTimestamp = performance.now();
        }

        // now last frame must has been drawn on the screen, so we could check whether the game is over
        game.checkResult();
        
        // figure out the transforms
        var eye = [lookRadius*0, lookRadius*150, lookRadius*300];
        var target = [0, 0, 0];
        var up = [0, 1, 0];
        var cameraM = twgl.m4.lookAt(eye, target, up); //camera matrix

        var viewM = twgl.m4.inverse(cameraM);//view matrix is the inverse of camera matrix

        // when we are testing fps at the first stage, player has no control, which means arcball has not been defined
        if (frameIndex > frameCount)
            viewM = twgl.m4.multiply(ab.getMatrix(), viewM); // world matrix of the object multiplyed by view matrix(in viewM)

        var fieldOfView = Math.PI / 4;
        var projectionM = twgl.m4.perspective(fieldOfView, 2, 10, 1000);

        // get lighting information
        var lightPosition = [2, 1, 2]; // the position of a single light in world coordinate. The number should be as
        // small as it can to utilize every pixel of the shadow map
        // so that
        var lightDirection = twgl.v3.subtract(lightPosition, target); // now light direction is in world coordinate
        //lightDirection = twgl.m4.transformPoint(viewM, lightDirection); // but we need light direction in camera coordinate,
        // as said in allObjects.js

        var lightViewM = twgl.m4.inverse(twgl.m4.lookAt(lightPosition, target, up));

        var lightProjectionM = twgl.m4.ortho(-175, 175, -175, 175, -175, 175); // The number should be as small as it
        // can to utilize every pixel of the shadow map. After testing, I found that the if you use a number smaller
        // than 175, the shadow map will not contain every objects in the world

        /* Because I use parallel light, I use orthogonal projection here.
        If you want to use dot light, please do following things:
        1. use perspective projection here
        2. pass lightPosition in camera coordinate to fragment shaders of every object. which means you should add
               lightPosition = twgl.m4.transformPoint(viewM, lightPosition);
           here and add it to the variable drawingState and add
               uniform vec3 uLightPosition;
           in fragment shaders of every object
        3. Compute light direction in camera coordinate for every vertex in fragment shaders of every object

        Here is an example for disc-fs: (only two lines are changed)

        #ifdef GL_ES
            precision highp float;
        #endif
        uniform vec3 uColor;
        // replace: uniform vec3 uLightDirection; by:
        uniform vec3 uLightPosition;
        // all other uniform, varying or const variables are unchanged, so I omit this part

        // functions pulse, blinnPhongShading and unpackDepth are unchanged here, so I omit this part.

        void main(void) {
            vec3 shadowCoordinate = (vPositionFromLight.xyz / vPositionFromLight.w) / 2.0 + 0.5;
            vec4 rgbaDepth = texture2D(uShadowMap, shadowCoordinate.xy);
            float depth = unpackDepth(rgbaDepth); // decode the depth value from the depth map
            float visibility = (shadowCoordinate.z > depth + 0.00001) ? 0.5 : 1.0;
            vec2 light = blinnPhongShading(uLightDirection, 1.0, 0.35, 1.0, 1.5, 30.0);
            // replace: vec2 light = blinnPhongShading(uLightDirection, 1.0, 0.35, 1.0, 1.5, 30.0); by:
            vec2 light = blinnPhongShading(uLightPosition - fPosition, 1.0, 0.35, 1.0, 1.5, 30.0);
            vec3 objectColor = (1.0 + 0.3 * pulse(uPosition.z, 0.1)) * uColor; // add some stripes
            vec3 ambientAndDiffuseColor = light.x * objectColor;
            vec3 specularColor = light.y * uLightColor;
	        gl_FragColor = vec4(visibility * (ambientAndDiffuseColor + specularColor), 1.0);
        }
        */

        var lightColor = normalizeRgb(255, 255, 255); // white light

        // make a real drawing state for drawing
        drawingState = {
            gl : gl,
            projection : projectionM,
            view : viewM,
            camera : cameraM,
            lightDirection : lightDirection,
            lightColor: lightColor,
            lightProjection : lightProjectionM,
            lightView : lightViewM,
            //shadowMap : framebuffer.texture,
            //shadowMapResolution: framebuffer.resolution,
            realTime : realTime,
        }

/*
        if (game.displayMode)
            game.displaySolution(drawingState);
*/

        // update the moving disc's position in world coordinate
        game.updateDiscPosition(drawingState);

        // draw to the framebuffer
        //gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        //gl.viewport(0, 0, framebuffer.resolution, framebuffer.resolution); // never forget to set viewport as our
        // texture's size

        // first, let's clear the background in the frame buffer
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        /*allObjects.forEach(function (object) {
            if(object.drawBefore)
                object.drawBefore(drawingState);
        });*/

        // return the frame buffer pointer to the system, now we can draw on the screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height); // never forget to reset viewport as canvas's size

        // let's clear the screen as a whiteboard
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        allObjects.forEach(function (object) {
            if(object.draw)
                object.draw(drawingState);
        });

        frameIndex++;
        realTime += 1000 / fps; // advance the clock appropriately (unless the screen is not refreshing when the web
        // page loses focus or when players invoke an alert message defined in function tryToMoveDisc in gameLogic.js)

        // the first frame whose index is 0 is not take into consideration
        if (frameIndex === frameCount + 1) {
            // update fps and 1 second = 1000 mill-seconds
            fps = Math.round(frameCount * 1000 / (performance.now()- startTimestamp));

            // now we could support user interactions
            bindButtonsToGame(game);
            bindKeysToGame(game);
            ab = new ArcBall(canvas);
        }

        window.requestAnimationFrame(draw);
    }
    draw();
}
window.onload = init;
