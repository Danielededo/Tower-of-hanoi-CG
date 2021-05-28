'use strict';
/**
 Since I want to draw a shadow, I need to draw a white ground first.
 */

// allow the constructor to be "leaked" out
var Ground = undefined;

// now, I make a function that adds an object to that list. There's a funky thing here where I have to not only define
// the function, but also run it - so it has to be put in parenthesis
(function() {

    // Read shader source
    var vertexSource = `attribute vec3 vPosition;
    uniform mat4 uMVP;
    uniform mat4 uMVPFromLight;
    varying vec4 vPositionFromLight;

    void main(void) {
        vPositionFromLight = uMVPFromLight * vec4(vPosition, 1.0); // compute position in light coordinate
        gl_Position = uMVP * vec4(vPosition, 1.0);
    }`;
    var fragmentSource = `/**
    * we do not use any texture to draw ground
    */
   #ifdef GL_ES
       precision highp float;
   #endif
   uniform vec3 uColor; // the ground's color
   uniform vec3 uLightColor;
   uniform sampler2D uShadowMap; // depth value in light coordinate
   uniform float uShadowMapResolution;
   varying vec4 vPositionFromLight;

   /**
    * compute z-value from a vec4
    */
   float unpackDepth(const in vec4 rgbaDepth) {
       const vec4 bitShift = vec4(1.0, 1.0 / 256.0, 1.0 / (256.0 * 256.0), 1.0 / (256.0 * 256.0 * 256.0));
       float depth = dot(rgbaDepth, bitShift);
       return depth;
   }

   /**
    * compute the visibility coefficient
    */
   float getVisibility(vec3 shadowCoordinate) {
       float sum = 0.0;
       // use a simple and incomplete but good enough percentage-closer filtering method.
       // take 16 points on shadow map as the sampler.
       for (float x = -1.5; x <= 1.5; x += 1.0) {
           for (float y = -1.5; y <= 1.5; y += 1.0) {
               if(shadowCoordinate.z > 1.0) {
                   // coordinates outside the far plane of the light's orthographic frustum will never be in shadow
                   sum += 1.0;
               } else {
                   vec2 biasedCoordinate = shadowCoordinate.xy + vec2(x, y) / uShadowMapResolution;
                   float depth = 1.0; // all coordinates outside the depth map's range have a default depth of 1.0
                   // which means these coordinates will never be in shadow since no object will have a depth larger than 1.0
                   if (biasedCoordinate.x >= 0.0 && biasedCoordinate.x <= 1.0 && biasedCoordinate.y >= 0.0 && biasedCoordinate.y <= 1.0) {
                       vec4 rgbaDepth = texture2D(uShadowMap, biasedCoordinate);
                       depth = unpackDepth(rgbaDepth); // decode the depth value from the depth map
                   }
                   sum += (shadowCoordinate.z > depth + 0.005) ? 0.5 : 1.0; // add 0.005 to eliminate Mach band, also known as shadow acne
               }
           }
       }
       return sum / 16.0;
   }

   void main(void) {
       vec3 shadowCoordinate = (vPositionFromLight.xyz / vPositionFromLight.w) / 2.0 + 0.5;
       float visibility = getVisibility(shadowCoordinate);
       vec3 finalColor = clamp((uColor + uLightColor) / 2.0, 0.0, 1.0); // mix the ground's color and the light's color
       gl_FragColor = vec4(visibility * finalColor, 1.0);
   }`;

    // compile the shaders only when initializing every object
    // we do not have to recompile them during drawing in every frame

    var shaderProgram = undefined;

    // As to rod, since every rod is identical, we could put vertexPos, normal and such things outside function init
    // so that we only create buffers once for every rod to save time.
    // As to discs, their size are different so data in buffers varies. We have to use this.vertexPos, this.normal and
    // so on inside function init.
    // As to the ground, we have one and only one ground, so either way is fine.
    var vertexPos;
    var normal;

    var posBuffer;
    var normalBuffer;

    /**
     * constructor for square Ground
     * @param name: a unique name
     * @param position: the position of the center of the ground in world coordinate
     * @param width: the ground plane width, which is the length in X and Z direction
     * @param color: a 3 dimension Float32Array storing r, g, b value ranged from 0 to 1 for shaders
     */
    Ground = function Ground(name, position, width, color) {
        this.name = name || 'ground';
        this.position = position || [0.0, 0.0, 0.0];
        this.width = width || 2000; // things will go from -1000 to +1000 by default. 2000 is big enough here.
        this.color = color || normalizeRgb(255, 255, 255); // white ground
    }

    //SHHH
    /**
     * compile the corresponding shader program and generate all data unchanged between two frames
     */
    Ground.prototype.initialize = function(drawingState) {
        var gl = drawingState.gl; // an abbreviation...

        if (!shaderProgram) {
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
            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert('Could not initialize shaders');
            }

            // with the vertex shader, we need to pass it positions as an attribute - so set up that communication
            shaderProgram.PositionAttribute = gl.getAttribLocation(shaderProgram, 'vPosition');

            // this gives us access to uniforms
            shaderProgram.MVPLoc = gl.getUniformLocation(shaderProgram, 'uMVP');
            shaderProgram.MVPFromLightLoc = gl.getUniformLocation(shaderProgram, 'uMVPFromLight');
            shaderProgram.ColorLoc = gl.getUniformLocation(shaderProgram, 'uColor');
            shaderProgram.LightColorLoc = gl.getUniformLocation(shaderProgram, 'uLightColor');
            shaderProgram.ShadowMapResolutionLoc = gl.getUniformLocation(shaderProgram, 'uShadowMapResolution');
            shaderProgram.ShadowMapLoc = gl.getUniformLocation(shaderProgram, 'uShadowMap');

            // data ...
            // vertex positions
            vertexPos = [
                -this.width / 2, 0, -this.width / 2,
                this.width / 2, 0, -this.width / 2,
                this.width / 2, 0,  this.width / 2,
                -this.width / 2, 0, -this.width / 2,
                this.width / 2, 0,  this.width / 2,
                -this.width / 2, 0,  this.width / 2
            ];


            // now to make the buffers
            posBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPos), gl.STATIC_DRAW);
        }
    }

    /**
     * compute shadow map
     */
    Ground.prototype.drawBefore = function(drawingState) {
        var modelM = twgl.m4.identity();
        twgl.m4.setTranslation(modelM, this.position, modelM);
        var MVP = twgl.m4.multiply(twgl.m4.multiply(modelM, drawingState.lightView), drawingState.lightProjection);

        // choose the shader program we have compiled
        gl.useProgram(shadowProgram);

        // we need to enable the attributes we had set up, which are set disabled by default by system
        gl.enableVertexAttribArray(shadowProgram.PositionAttribute);

        // set the uniform
        gl.uniformMatrix4fv(shadowProgram.MVPLoc, false, MVP);

        // connect the attribute to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(shadowProgram.PositionAttribute, 3, gl.FLOAT, false, 0, 0);

        // Do the drawing
        gl.drawArrays(gl.TRIANGLES, 0, vertexPos.length / 3);

        // WebGL is a state machine, so do not forget to disable all attributes after every drawing
        gl.disableVertexAttribArray(shadowProgram.PositionAttribute);
    }

    /**
     * draw on the screen
     */
    Ground.prototype.draw = function(drawingState) {
        // we make a model matrix to place the ground in the world
        var modelM = twgl.m4.identity();
        twgl.m4.setTranslation(modelM, this.position, modelM);
        var MVP = twgl.m4.multiply(twgl.m4.multiply(modelM, drawingState.view), drawingState.projection);
        var MVPFromLight = twgl.m4.multiply(twgl.m4.multiply(modelM, drawingState.lightView), drawingState.lightProjection);

        var gl = drawingState.gl;

        // choose the shader program we have compiled
        gl.useProgram(shaderProgram);

        // we need to enable the attributes we had set up, which are set disabled by default by system
        gl.enableVertexAttribArray(shaderProgram.PositionAttribute);

        // set the uniforms
        gl.uniformMatrix4fv(shaderProgram.MVPLoc, false, MVP);
        gl.uniformMatrix4fv(shaderProgram.MVPFromLightLoc, false, MVPFromLight);
        gl.uniform3fv(shaderProgram.ColorLoc, this.color);
        gl.uniform3fv(shaderProgram.LightColorLoc, drawingState.lightColor);
        gl.uniform1f(shaderProgram.ShadowMapResolutionLoc, drawingState.shadowMapResolution);
        gl.uniform1i(shaderProgram.ShadowMapLoc, 0); // we will store the shadow map in TMU0 soon, so instruct shader
        // programs to use use TMU0

        // connect the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(shaderProgram.PositionAttribute, 3, gl.FLOAT, false, 0, 0);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0); // bind our shadow map to TMU0
        gl.bindTexture(gl.TEXTURE_2D, drawingState.shadowMap);

        // Do the drawing
        gl.drawArrays(gl.TRIANGLES, 0, vertexPos.length / 3);

        // WebGL is a state machine, so do not forget to disable all attributes after every drawing
        gl.disableVertexAttribArray(shaderProgram.PositionAttribute);
    }

    /**
      * return the center position in model coordinate for examination
      */
    Ground.prototype.center = function(drawingState) {
        return this.position;
    }

})();