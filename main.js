/** the main file
 * If you want to adjust the position or the size of rods and discs, or the flying altitude of the moving disc, please
 * modify numbers in function Game in gameLogic.js
 * If you want to speed up the moving disc, please modify variable movingSpeed defined in
 * Game.prototype.updateDiscPosition in gameLogic.js
*/

// array of shaderProgram
var allObjects = [];
var shaderProgram = new Array();

var lookRadius = 1.0;

function doMouseWheel(event) {
	var nLookRadius = lookRadius + event.wheelDelta/1000.0;
	if((nLookRadius > 0.5) && (nLookRadius < 2.0)) {
		lookRadius = nLookRadius;
	}
}

async function init() {

    // create canvas
    var canvas = document.getElementById("my-canvas");
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
    
    // initialize all objects(the objects are game attributes)
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
            object.initialize(drawingState); // actual initialization
    });
    
    var ab; // the arcball

    var realTime = performance.now(); // the returned value represents the time elapsed since the time origin

    var frameIndex = 0;
    var frameCount = 10; // only use 10 frames (the second frame to the eleventh frame) to compute user's fps
    var startTimestamp; // for computing user's fps

    var fps = 60; // fps = 60 Hz (updated soon after the first 10 frames)

    /**
     * the main drawing function
    **/
    function draw() {

        // since we have drawn the first frame now, the web page must have the focus
        if (frameIndex == 1) {
            startTimestamp = performance.now();
        }

        // now last frame must has been drawn on the screen, so we could check whether the game is over
        game.checkResult();
        
        // here we compute the view matrix (through the camera matrix) and the projection matrix (through the function perspective)
        //  view matrix will be passed to the single objects for the computation of its viewWorld matrix (modelViewM)
        var eye = [lookRadius*0, lookRadius*150, lookRadius*300]; // position of the camera
        var target = [0, 0, 0];
        var up = [0, 1, 0];
        var cameraM = twgl.m4.lookAt(eye, target, up); // Mc = camera matrix

        // Mv = (Mc)^-1
        var viewM = twgl.m4.inverse(cameraM); // Mv = view matrix = the inverse of camera matrix

        // when we are testing fps at the first stage, player has no control, which means arcball has not been defined
        if (frameIndex > frameCount)
            viewM = twgl.m4.multiply(ab.getMatrix(), viewM); // rotation matrix multiplyed by view matrix(in viewM)

        var fieldOfView = Math.PI / 4;
        var projectionM = twgl.m4.perspective(fieldOfView, 2, 10, 1000); // Mp = perspective projection


        // get lighting information
        var lightPosition = [-1.5, 1, 1]; // the position of a single light in world coordinate.

        var lightDirection = twgl.v3.subtract(lightPosition, target); // now light direction is in world coordinate

        var ambientLightColor = [1, 1, 1];

        // if we had need to transform light direction in camera coordinate:
        // lightDirection = twgl.m4.transformPoint(viewM, lightDirection);

        var lightColor = [0.5, 0.5, 0.5]; // white light

        // make a real drawing state for drawing
        drawingState = {
            gl : gl,
            projection : projectionM, // perspective projection matrix
            view : viewM, // view matrix
            lightDirection : lightDirection,
            lightColor: lightColor,
            ambientLightColor : ambientLightColor,
            realTime : realTime,
            eye : eye, // position of the camera
        }

        // update the moving disc's position in world coordinate
        game.updateDiscPosition(drawingState);

        // first, let's clear the background in the frame buffer
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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