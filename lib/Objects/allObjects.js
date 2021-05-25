/**
 * Created by gleicher on 10/9/2015.
 */

/**
 this file defines what a "graphics object" is for the whole graphics system
 rather than defining a class, as you would in a conventional programming language,
 we define the properties that the objects must have.

 when you make a new object to put in the world, it must do the required things.
 you can make your own objects that do the right things.
 you can have these objects refer to the example objects as prototypes
 you can make your own prototypes
 and so forth...

 you should define your objects in javascript files that are loaded before the main.js

 it also provides the specification for what the drawing state object will look like
 **/

var allObjects = [];

// an object in allObjects array must have the following:
//
// fields:
// name - a unique string (each instance must be a unique string)
//
//
// note: the methods are always called using the method invocation pattern
//  (so "this" is what you expect)
//
// methods:
// draw - a function that is called each time the image is redrawn
//   it takes a single parameter: a "DrawingState Object"
// init - a function that is called once (per object) before the first draw
//   but AFTER the GL context is prepares. It takes a drawing state object
//   as a parameter
// center - a function that takes a DrawingState and returns a 3-vector that is
//   the position of the center of the object. this is used for "inspection" mode


/*
the DrawingState

the DrawingState object (which is passed to the draw and init methods) has the following
fields defined:

 gl - the gl context to draw into

 Things for viewing:
 view - the viewing transform: from world to camera
   note: because the view transform is a rotate, translate, uniform scale, it can be used to transform normals if desired
    (personally, I prefer to do lighting computations in world space)
 camera - the camera transform: this is the inverse of the view transform (it goes from the camera coordinates to world
    coordinate)
 projection - the projection matrix

 Things for lighting:
 lightDirection - a vector of the lighting direction in camera coordinate, not in world coordinate. You do not have to
 normalize it
 lightColor - a unit vector of the lighting color. Please do not forget to normalize the vector

 Things for shadow:
 lightProjection - the projection matrix for light. orthogonal projection for parallel lights and perspective projection
    for a dot light
 lightView - the viewing transform for light, which means you put the camera at the position of the light.
 shadowMap - a texture storing depth value in light coordinate
 shadowMapResolution - the width (length) of the shadow map used to anti-aliasing for shadows

  Things for animating:
 realTime - a number that is (roughly) the number of milliseconds since the program
  started running. You can use this variable to make things move. You could also add a button or a checkbox to allow
  user "stop" this clock. Please see the code in function draw in main.js.

 a concrete example:
 drawingState = {
     gl : gl,
     projection : projectionM,
     view : viewM,
     camera : cameraM,
     lightDirection : lightDirection,
     lightColor: lightColor,
     lightProjection : lightProjectionM,
     lightView : lightViewM,
     shadowMap : framebuffer.texture,
     shadowMapResolution: framebuffer.resolution,
     realTime : realTime,
 }
 since main.js has not been executed and gl has not defined yet, the example does not work here.
 */

// utility routines
// find an object with a particular name
function findObject(name) {
    var result = null;
    allObjects.forEach(function(object) {
        if (object.name == name) {
            result = object;
        }
    });
    return result;
}

// initialize all of the objects that haven't yet been initialized
function initializeObjects(game, drawingState) {

    function isValidGraphicsObject (object) {
        if(object.name === undefined) {
            console.log("warning: GraphicsObject missing name field");
            return false;
        }

        if(typeof object.drawBefore !== "function" && typeof object.draw !== "function" && typeof object.drawAfter !== "function") {
            console.log("warning: GraphicsObject of type " + object.name + " does not contain a draw or drawBefore or drawAfter method");
            return false;
        }

        if(typeof object.center !== "function") {
            console.log("warning: GraphicsObject of type " + object.name + " does not contain a center method. ");
            return false;
        }

        if(typeof object.init !== "function") {
            console.log("warning: GraphicsObject of type " + object.name + " does not contain an init method. ");
            return false;
        }

        return true;
    }

    // push every object in the game into the allObjects array for drawing
    allObjects.push(new Ground());
    for (var i = 0; i < game.getNumberOfRods(); i++)
        allObjects.push(game.rods[i]);
    for (i = 0; i < game.getNumberOfRods(); i++)
        for (var j = 0; j < game.rods[i].getNumberOfDiscs(); j++)
            allObjects.push(game.rods[i].stackOfDiscs[j]);

    allObjects.forEach(function(object) {
        if(!object.__initialized) {
            if(isValidGraphicsObject(object)){
                object.init(drawingState);
                object.__initialized = true;
            }
        }
    });
}

var shadowProgram = undefined;

// compile the shader program for shadow
function compileShadowProgram(drawingState) {
    if (!shadowProgram) {
        gl = drawingState.gl;

        // Read shader source
        var vertexSource = `attribute vec3 vPosition;
        uniform mat4 uMVP; // model-view-projection matrix

        void main(void) {
            gl_Position = uMVP * vec4(vPosition, 1.0); // compute position in light coordinate
        }`;
        var fragmentSource = ` #ifdef GL_ES
        precision highp float;
    #endif
    // we use a texture as the depth map and all channels of a texture (r, g, b and a) are 8-bit, so every point in
    // a texture is 32-bit. Float here is 16-bit, so if we utilize all 32 bits in a texture, it is quite sufficient.
    const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
    const vec4 bitMask = vec4(1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0, 0.0);

    void main(void) {
        vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);
        rgbaDepth -= rgbaDepth.gbaa * bitMask;
        gl_FragColor = rgbaDepth;
    }`;

        // Compile vertex shader
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(vertexShader));
            return null;
        }

        // Compile fragment shader
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(fragmentShader));
            return null;
        }

        // Attach the shaders and link
        shadowProgram = gl.createProgram();
        gl.attachShader(shadowProgram, vertexShader);
        gl.attachShader(shadowProgram, fragmentShader);
        gl.linkProgram(shadowProgram);
        if (!gl.getProgramParameter(shadowProgram, gl.LINK_STATUS)) {
            alert('Could not initialize shaders');
        }

        // with the vertex shader, we need to pass it positions as an attribute - so set up that communication
        shadowProgram.PositionAttribute = gl.getAttribLocation(shadowProgram, 'vPosition');

        // this gives us access to uniforms
        shadowProgram.MVPLoc = gl.getUniformLocation(shadowProgram, 'uMVP');
    }
}

/**
 * In order to get the depth map in light coordinate, we have to draw on a frame buffer for the first pass
 * @return: a frame buffer object who has a texture object
 */

function createFramebufferForShadow(drawingState) {
    gl = drawingState.gl;

    // define a function to release GPU's memory when an error occurred to us
    function errorHandling() {
        if(framebuffer)
            gl.deleteFramebuffer(framebuffer);
        if(framebuffer.texture)
            gl.deleteFramebuffer(framebuffer.texture);
        if(framebuffer.depthBuffer)
            gl.deleteFramebuffer(framebuffer.depthBuffer);
    }

    // First of all, create a framebuffer object
    var framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        console.log("fail to create a frame buffer");
        errorHandling();
        return;
    }

    /* Secondly, create a texture for the frame buffer. You can use any name for the texture, such as tex. You do not
       have to set it as an attribute of the JavaScript object variable framebuffer like here. Then you could return a
       Javascript array which contains a framebuffer, a texture and the resolution for this function and modify codes
       in main.js. I just set texture as an attribute of the JavaScript object variable framebuffer for simplicity. */
    framebuffer.texture = gl.createTexture();
    if (!framebuffer.texture) {
        console.log("fail to create a texture for the frame buffer");
        errorHandling();
        return;
    }
    // bind the current texture to texture mapping unit 0 in order to set framebuffer.texture's attribute
    /* A texture mapping unit (TMU) is a component in modern GPUs. In modern graphics cards it is implemented as a
       discrete stage in a graphics pipeline where a pipeline is the graphics card's architecture, which provides a
       generally accurate idea of the computing power of a graphics processor. For example, A Geforce 3 had 4 pixel
       pipelines, each of which had 2 TMUs.
       WebGL provides at least 8 TMUs, and my laptop has 16 TMUs. */
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, framebuffer.texture);

    /* resolution must be power of 2, such as 256 or 1024 for WebGL because we use a texture. You could use any name for
       the variable here, such  as res. Then you could return a Javascript array which contains a framebuffer, a texture
       and the resolution for this function and modify codes in main.js. I just set the resolution number as an
       attribute of the JavaScript object variable framebuffer for simplicity.
       Since we use both a texture and a render buffer for the framebuffer, the resolution is constrained by both of them.
       let's denote Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) as n.
       Because we draw 2 pass for every frame, we cannot just use n for resolution or it will crash.
       The maximum resolution here we can utilize is n / 2. Because 2 pass * (n / 2) ^ 2 = n ^ 2 / 4 <= n ^ 2 and n / 2
       is a power of 2, n / 2 is fine.
       */
    // get the max possible resolution
    var maxResolution = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) / 2;
    framebuffer.resolution = Math.min(2048, maxResolution); // Although 4096 is better, I found that 2048 is good enough.
    //framebuffer.resolution = maxResolution;
    // use null to return the texture's image data pointer to system's frame buffer (this step is unnecessary)
    // in fact, you could use any number in texImage2D instead of resolution.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebuffer.resolution, framebuffer.resolution, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    // use linear filters for anti-aliasing
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Thirdly, create a render buffer for the frame buffer. You can use any name for the render buffer, such as rb.
    // You do not have to set it as an attribute of the JavaScript object variable framebuffer like here.
    framebuffer.depthBuffer = gl.createRenderbuffer();
    if (!framebuffer.depthBuffer) {
        console.log("fail to create a render buffer for the frame buffer");
        errorHandling();
        return;
    }
    // bind framebuffer.depthBuffer in order to set its attributes
    gl.bindRenderbuffer(gl.RENDERBUFFER, framebuffer.depthBuffer);
    // set the size of the render buffer
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, framebuffer.resolution, framebuffer.resolution);

    // Fourthly, bind both the texture and the render buffer to our framebuffer
    // set our variable framebuffer as the current working framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    // attach the texture to the frame buffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebuffer.texture, 0);
    // attach the render buffer to the frame buffer, too
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, framebuffer.depthBuffer);
    // check whether texture and render buffer is bound to our framebuffer
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);  
    if (status !== gl.FRAMEBUFFER_COMPLETE){  
        console.log("Error in setting frame buffer" + status.toString());  
        errorHandling();
        return;  
    } 

    // Fifthly, return all pointers to system's frame buffer (this step is unnecessary)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return framebuffer;
}
