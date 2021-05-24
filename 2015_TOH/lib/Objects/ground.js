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
    var vertexSource = $('#ground-vs')[0].text;
    var fragmentSource = $('#ground-fs')[0].text;

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

    /**
     * compile the corresponding shader program and generate all data unchanged between two frames
     */
    Ground.prototype.init = function(drawingState) {
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
        var modelM = m4.identity();
        m4.setTranslation(modelM, this.position, modelM);
        var MVP = m4.multiply(m4.multiply(modelM, drawingState.lightView), drawingState.lightProjection);

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
        var modelM = m4.identity();
        m4.setTranslation(modelM, this.position, modelM);
        var MVP = m4.multiply(m4.multiply(modelM, drawingState.view), drawingState.projection);
        var MVPFromLight = m4.multiply(m4.multiply(modelM, drawingState.lightView), drawingState.lightProjection);

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