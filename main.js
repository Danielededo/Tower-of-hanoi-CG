// array of shaderProgram
var allObjects = [];
var shaderProgram = new Array();

var lightType;
var diffuseType;
var specularType;

var lookRadius = 1.0;
var gl;

function doMouseWheel(event) {
	var nLookRadius = lookRadius + event.wheelDelta/1000.0;
	if((nLookRadius > 0.6) && (nLookRadius < 3.0)) {
		lookRadius = nLookRadius;
	}
}

function changeLightType(value){
    switch(value){
        case "direct":
            lightType = [1.0, 0.0];
            break;
        case "point":
            lightType = [0.0, 1.0];
            break;
    }
}

function changeDiffuseType(value){
    switch(value){
        case "lambert":
            diffuseType = [1.0, 0.0];
            break;
        case "toon":
            diffuseType = [0.0, 1.0];
            break;
        case "none":
            diffuseType = [0.0, 0.0];
            break;
    }
}

function changeSpecularType(value){
    switch(value){
        case "blinn":
            specularType = [0.0, 1.0, 0.0];
            break;
        case "phong":
            specularType = [1.0, 0.0, 0.0];
            break;
        case "toonP":
            specularType = [1.0, 0.0, 1.0];
            break;
        case "toonB":
            specularType = [0.0, 1.0, 1.0];
            break;
        case "none":
            specularType = [0.0, 0.0, 0.0];
            break;
    }
}

async function main() {

    // create canvas
    var canvas = document.getElementById("my-canvas");
    canvas.addEventListener("mousewheel", doMouseWheel, false); // zoom
    gl = canvas.getContext('webgl2'); // gl should not be a global variable and it should be wrapped in object
    // drawingState defined in allObjects.js so that you could draw many animations on one web page.
    if (!gl) {
        document.write('Your browser does not support WebGL, please use another browser.');
        return;
    }

    lightType = [1.0, 0.0];
    diffuseType = [1.0, 0.0];
    specularType = [1.0, 0.0, 0.0];
    // start a new game through the constructor
    var game = new Game();

    // retrieve shaders using path
    var path = window.location.pathname;
    var page = path.split("/").pop();
    var baseDir = window.location.href.replace(page, '');
    var shaderDir = baseDir + "Shaders/";

    // compile the shaders for rod 
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
    
    // for the object initialization
    var drawingState = {
        gl : gl
    }
    // initialize all objects (the objects are game attributes)
    for (var i = 0; i < game.getNumberOfRods(); i++){
        allObjects.push(game.rods[i]); // push the rods
    }
    for (i = 0; i < game.getNumberOfRods(); i++){
        for (var j = 0; j < game.rods[i].getNumberOfDiscs(); j++){
            allObjects.push(game.rods[i].stackOfDiscs[j]); // push the discs
        }
    }
    allObjects.forEach(
        function(object){
            object.initialize(drawingState); // actual initialization
    });
    
    var ab; // the arcball for the rotation

    // for the animation
    var realTime = performance.now(); // the returned value represents the time elapsed since the time origin

    var frameIndex = 0;
    var frameCount = 10; // only use 10 frames (the second frame to the eleventh frame) to compute user's fps
    var startTimestamp; // for computing user's fps

    var fps = 60; // fps = 60 Hz (updated soon after the first 10 frames)

    // drawing function
    function draw() {

        // here we compute the view matrix (through the camera matrix) and the projection matrix (through the function perspective)
        //  view matrix will be passed to the single objects for the computation of its viewWorld matrix (modelViewM)
        var eye = [lookRadius*0.0, lookRadius*1.5, lookRadius*3.0]; // position of the camera
        var target = [0.0, 0.0, 0.0];
        var up = [0.0, 1.0, 0.0];
        var cameraM = twgl.m4.lookAt(eye, target, up); // Mc = camera matrix

        // Mv = (Mc)^-1
        var viewM = twgl.m4.inverse(cameraM); // Mv = view matrix = the inverse of camera matrix

        // when we are testing fps at the first stage, player has no control, which means arcball has not been defined
        if (frameIndex > frameCount)
            viewM = twgl.m4.multiply(ab.getMatrix(), viewM); // rotation matrix multiplyed by view matrix(in viewM)

        var fieldOfView = Math.PI / 4;
        var aspectRatio = canvas.width/canvas.height;
        var projectionM = twgl.m4.perspective(fieldOfView, aspectRatio, 0.1, 100); // Mp = perspective projection

        var lightDecay = 0.3;
        var lightTarget = 1.0;

        var lightPosition = [2.0, 1.0, 1.0]; // the position of the point and spot light

        var lightDirection = [-1.0, 1.0, 1.0]; // the direction of the direct light

        var ambientLightColor = [1.0, 1.0, 1.0];


        var specularColor = [0.4, 0.4, 0.4];

        var diffuseColor = [0.6, 0.6, 0.6];

        var specShine = 0.7;

        var DToonTh = 0.8;

        var SToonTh = 0.2;

        var lightColor = [0.5, 0.5, 0.5];

        // make a real drawing state for drawing
        drawingState = {
            gl : gl,
            projection : projectionM, // perspective projection matrix
            view : viewM, // view matrix
            lightDecay : lightDecay,
            lightTarget : lightTarget,
            lightPosition : lightPosition,
            lightDirection : lightDirection,
            lightColor: lightColor,
            ambientLightColor : ambientLightColor,
            specularColor : specularColor,
            diffuseColor : diffuseColor,
            specShine : specShine,
            DToonTh : DToonTh,
            SToonTh : SToonTh,
            realTime : realTime,
            eye : eye, // position of the camera
        }

        // first, let's clear the background in the frame buffer
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // return the frame buffer pointer to the system, now we can draw on the screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);

        // let's clear the screen as a whiteboard
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        
        // first check whether the game is over
        game.checkResult();
        
        // then update the moving disc's position in world coordinate
        game.updateDiscPosition(drawingState);

        // finally draw all the objects
        allObjects.forEach(function (object) {
            if(object.draw)
                object.draw(drawingState);
        });

        // for the animation

        if (frameIndex == 1) { // first frame drawn
            startTimestamp = performance.now();
        }

        frameIndex++;

        /* advance the clock appropriately (unless the screen is not refreshing when the web
        *  page loses focus or when players invoke an alert message defined in function tryToMoveDisc in gameLogic.js)
        */
        realTime += 1000 / fps;

        // the first frame whose index is 0 is not taken into consideration
        if (frameIndex === frameCount + 1) {
            // update fps (1 second = 1000 mill-seconds)
            fps = Math.round(frameCount * 1000 / (performance.now() - startTimestamp));

            // from now on support user interactions
            bindButtonsToGame(game);
            bindKeysToGame(game);
            ab = new ArcBall(canvas);
        }

        window.requestAnimationFrame(draw);
    }
    draw();
}
window.onload = main;