var allObjects = [];

// an object in allObjects array must have the following methods:
// draw, called each time the image is redrawn
//   it takes a single parameter: a "DrawingState Object"
// init, called once (per object) before the first draw but AFTER the GL context
//   it takes a "DrawingState Object" as a parameter
// center, takes a "DrawingState Object"
//   returns a 3-vector that is the position of the center of the object


/*
DrawingState object (passed to the draw and init methods) has the following fields:

 gl: the gl context to draw into;

 view: the viewing transform, from world to camera (because the view transform is a rotate, translate, uniform scale, it can be used to transform normals if desired);

 camera: the camera transform, the inverse of the view transform (it goes from the camera coordinates to world
    coordinates);

 projection: the projection matrix;

 lightDirection: a vector of the lighting direction in camera coordinate, not in world coordinate (to be normalized);

 lightColor: a unit vector of the lighting color;

 lightProjection: the projection matrix for light, orthogonal projection for parallel lights and perspective projection
    for a dot light;

 lightView: the viewing transform for light, (i.e. you put the camera at the position of the light);

 shadowMap: a texture storing depth value in light coordinate;

 shadowMapResolution: the width (length) of the shadow map used to anti-aliasing for shadows;

 realTime: (roughly) the number of milliseconds since the program started running (to be used to make things move).

 A concrete example of an instance ofthe object drawingState:
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
 */

// Utility routines:

// initialize all of the objects that haven't yet been initialized
function initializeObjects(game, drawingState) {

// push every object in the game into the allObjects array for drawing
//DEL: allObjects.push(new Ground());
    for (var i = 0; i < game.getNumberOfRods(); i++)
        allObjects.push(game.rods[i]); //push the rods
    for (i = 0; i < game.getNumberOfRods(); i++)
        for (var j = 0; j < game.rods[i].getNumberOfDiscs(); j++)
            allObjects.push(game.rods[i].stackOfDiscs[j]); // push the discs

    allObjects.forEach(function(object) {
        object.initialize(drawingState);
    });
}

//SHHH
var shadowProgram = undefined;

//SHHH
// compile the shader program for shadow
function compileShadowProgram(drawingState) {
    if (!shadowProgram) {
        gl = drawingState.gl;
        /*var path = window.location.pathname;
        var page = path.split("/").pop();
        var baseDir = window.location.href.replace(page, '');
        var shaderDir = baseDir + "shaders/";

        await utils.loadFiles([shaderDir + 'shadow_vs.glsl', shaderDir + 'shadow_fs.glsl'], function (shaderText) {
            var vertexShader = utils.createShader(gl, gl.VERTEX_SHADER, shaderText[0]);
            var fragmentShader = utils.createShader(gl, gl.FRAGMENT_SHADER, shaderText[1]);
            shadowProgram = utils.createProgram(gl, vertexShader, fragmentShader);
        });*/
        // Read shader source
        var vertexSource = `#version 300 es

        in vec3 vPosition;
        uniform mat4 uMVP; // model-view-projection matrix

        void main(void) {
            gl_Position = uMVP * vec4(vPosition, 1.0); // compute position in light coordinate
        }`;
        var fragmentSource = `#version 300 es
        
        #ifdef GL_ES
        precision highp float;
        #endif
        // we use a texture as the depth map and all channels of a texture (r, g, b and a) are 8-bit, so every point in
        // a texture is 32-bit. Float here is 16-bit, so if we utilize all 32 bits in a texture, it is quite sufficient.
        const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);
        const vec4 bitMask = vec4(1.0 / 256.0, 1.0 / 256.0, 1.0 / 256.0, 0.0);
        out vec4 myOutputColor;
        void main(void) {
            vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);
            rgbaDepth -= rgbaDepth.gbaa * bitMask;
            myOutputColor = rgbaDepth;
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

//SHHH
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
