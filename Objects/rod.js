'use strict';

// allow the constructor to be "leaked" out
var Rod = undefined;

// now, I make a function that adds an object to that list. There's a funky thing here where I have to not only define
// the function, but also run it - so it has to be put in parenthesis
(function() {

    // Read shader source
    var vertexSource = $('#rod-vs')[0].text;
    var fragmentSource = $('#rod-fs')[0].text;

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
    var texCoord;

    var posBuffer;
    var normalBuffer;
    var texCoordBuffer;

    var texture;

    var rodIndex = 1; // for the constructor of rod

    /**
     * constructor for Rod
     * @param name: a unique name
     * @param position: the position of the center of the bottom face of a rod in world coordinate
     * @param diameter: diameter of the top face and the bottom face
     * @param height: height of rod
     * @param precision: the number of triangles in the top face to simulate a circle
     * @param color: a 3 dimension Float32Array storing r, g, b value ranged from 0 to 1 for shaders
     */
    Rod = function Rod(name, position, diameter, height, precision, color) {
        this.name = name || 'rod' + rodIndex++;
        this.position = position || [0.0, 0.0, 0.0];
        this.diameter = diameter || 20;
        this.height = height || 60;
        this.precision = precision || 50;
        this.color = color || normalizeRgb(218, 165, 32); // GoldenRod defined by html5. However I use image texture for
        // rods so this.color is not used
        this.stackOfDiscs = []; // store discs
    }

    /**
     * compile the corresponding shader program and generate all data unchanged between two frames
     */
    Rod.prototype.init = function(drawingState) {
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
            shaderProgram.NormalAttribute = gl.getAttribLocation(shaderProgram, 'vNormal');
            shaderProgram.TexCoordAttribute = gl.getAttribLocation(shaderProgram, 'vTexCoord');

            // this gives us access to uniforms
            shaderProgram.ModelViewLoc = gl.getUniformLocation(shaderProgram, 'uModelView');
            shaderProgram.ProjectionLoc = gl.getUniformLocation(shaderProgram, 'uProjection');
            shaderProgram.NormalMatrixLoc = gl.getUniformLocation(shaderProgram, 'uNormal');
            shaderProgram.MVPFromLightLoc = gl.getUniformLocation(shaderProgram, 'uMVPFromLight');
            shaderProgram.LightDirectionLoc = gl.getUniformLocation(shaderProgram, 'uLightDirection');
            shaderProgram.LightColorLoc = gl.getUniformLocation(shaderProgram, 'uLightColor');
            shaderProgram.ShadowMapLoc = gl.getUniformLocation(shaderProgram, 'uShadowMap');
            shaderProgram.TexSamplerLoc = gl.getUniformLocation(shaderProgram, 'uTexSampler');

            // data ...
            // vertex positions
            vertexPos = this.generateLocalPosition();
            // normals
            normal = this.generateNormal();
            // texture coordinates
            texCoord = this.generateTextureCoordinate();

            // now to make the buffers
            posBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPos), gl.STATIC_DRAW);
            normalBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normal), gl.STATIC_DRAW);
            texCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);

            // set up texture
            texture = gl.createTexture();
            // following three lines are unnecessary
            gl.activeTexture(gl.TEXTURE1); // since we use TMU0 for shadow map, we use TMU1 here.
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); // return the image data
            // pointer to the system

            // load texture. Following two lines are critical for binding our texture object and the image
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, LoadedImageFiles["woodTexture.jpg"]);
            // since we always load texture JavaScript files before loading objects JavaScript files, all images must
            // have finished loading procedures now

            // Option 1 : Use mipmap, select interpolation mode
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

            // Option 2: At least use linear filters
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // Optional ... if your shader & texture coordinates go outside the [0,1] range
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT); // I want symmetrical pattern
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);

            // return the texture pointer to the system (this step is unnecessary)
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }
    
    /**
     * create a rod in model coordinate <br/>
     * People use 3ds Max, cinema 4d or other tools to create models in industry but I do not have any tools so I have 
     * to create models by JavaScript codes. <br/>
     * All models are created before the drawing procedure, so if you want to shorten the waiting time before you see
     * anything on screen, you could use any tool mentioned above to draw a rod (3 rods are identical so you could only
     * draw one of them) and 4 discs and export 5 separate WaveFront obj files. Then you could use create_vertex_list.py
     * to extract concrete numbers stored in obj files and copy there numbers into functions init for variables 
     * vertexPos, normal and texCoord.
     * @return: a Float32Array contains all vertices
     */
    Rod.prototype.generateLocalPosition = function() {
        var radius = this.diameter / 2;
        var position = new Float32Array(3 * 3 * 4 * this.precision);
        // we need 4 * this.precision triangles to depict a rod
        // every triangle has 3 vertices, so we need to multiply 3
        // every point needs 3 numbers to describe its position in 3D coordinate
    
        for (var i = 0; i < this.precision; i++) {
            // for the bottom face
            position[9 * i + 0] = 0;
            position[9 * i + 1] = 0;
            position[9 * i + 2] = 0;
            position[9 * i + 3] = radius * Math.sin(i / this.precision * 2 * Math.PI);
            position[9 * i + 4] = 0;
            position[9 * i + 5] = radius * Math.cos(i / this.precision * 2 * Math.PI);
            position[9 * i + 6] = radius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
            position[9 * i + 7] = 0;
            position[9 * i + 8] = radius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
    
            // for the top face
            position[9 * this.precision + 9 * i + 0] = 0;
            position[9 * this.precision + 9 * i + 1] = this.height;
            position[9 * this.precision + 9 * i + 2] = 0;
            position[9 * this.precision + 9 * i + 3] = radius * Math.sin(i / this.precision * 2 * Math.PI);
            position[9 * this.precision + 9 * i + 4] = this.height;
            position[9 * this.precision + 9 * i + 5] = radius * Math.cos(i / this.precision * 2 * Math.PI);
            position[9 * this.precision + 9 * i + 6] = radius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
            position[9 * this.precision + 9 * i + 7] = this.height;
            position[9 * this.precision + 9 * i + 8] = radius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
    
            // for side face
            position[18 * this.precision + 9 * i + 0] = radius * Math.sin(i / this.precision * 2 * Math.PI);
            position[18 * this.precision + 9 * i + 1] = 0;
            position[18 * this.precision + 9 * i + 2] = radius * Math.cos(i / this.precision * 2 * Math.PI);
            position[18 * this.precision + 9 * i + 3] = radius * Math.sin(i / this.precision * 2 * Math.PI);
            position[18 * this.precision + 9 * i + 4] = this.height;
            position[18 * this.precision + 9 * i + 5] = radius * Math.cos(i / this.precision * 2 * Math.PI);
            position[18 * this.precision + 9 * i + 6] = radius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
            position[18 * this.precision + 9 * i + 7] = this.height;
            position[18 * this.precision + 9 * i + 8] = radius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
            position[27 * this.precision + 9 * i + 0] = radius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
            position[27 * this.precision + 9 * i + 1] = this.height;
            position[27 * this.precision + 9 * i + 2] = radius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
            position[27 * this.precision + 9 * i + 3] = radius * Math.sin(i / this.precision * 2 * Math.PI);
            position[27 * this.precision + 9 * i + 4] = 0;
            position[27 * this.precision + 9 * i + 5] = radius * Math.cos(i / this.precision * 2 * Math.PI);
            position[27 * this.precision + 9 * i + 6] = radius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
            position[27 * this.precision + 9 * i + 7] = 0;
            position[27 * this.precision + 9 * i + 8] = radius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
        }
    
        return position;
    }

    /**
     * generate all normal vectors of a rod's surface
     * @return: a Float32Array contains every vertical's normal
    */
    Rod.prototype.generateNormal = function() {
        this.precision = this.precision || 36;
        var normal = new Float32Array(3 * 3 * 4 * this.precision);
    
        for (var i = 0; i < this.precision; i++) {
            for (var j = 0; j < 2; j++) {
                // for the bottom face
                normal[9 * i + 3 * j + 0] = 0;
                normal[9 * i + 3 * j + 1] = -1;
                normal[9 * i + 3 * j + 2] = 0;
    
                // for the top face
                normal[9 * this.precision + 9 * i + 3 * j + 0] = 0;
                normal[9 * this.precision + 9 * i + 3 * j + 1] = 1;
                normal[9 * this.precision + 9 * i + 3 * j + 2] = 0;
    
                // for side face
                normal[18 * this.precision + 9 * i + 3 * j + 0] = Math.sin((i + 0.5) / this.precision * 2 * Math.PI);
                normal[18 * this.precision + 9 * i + 3 * j + 1] = 0;
                normal[18 * this.precision + 9 * i + 3 * j + 2] = Math.cos((i + 0.5) / this.precision * 2 * Math.PI);
                normal[27 * this.precision + 9 * i + 3 * j + 0] = Math.sin((i + 0.5) / this.precision * 2 * Math.PI);
                normal[27 * this.precision + 9 * i + 3 * j + 1] = 0;
                normal[27 * this.precision + 9 * i + 3 * j + 2] = Math.cos((i + 0.5) / this.precision * 2 * Math.PI);
            }
        }
    
        return normal;
    }

    /**
     * generate all texture coordinate of a rod's surface
     * @return: a Float32Array contains every vertical's texture coordinate
    */
    Rod.prototype.generateTextureCoordinate = function() {
        var radius = this.diameter / 2;
        var coordinate = new Float32Array(2 * 3 * 4 * this.precision);
        // we need 4 * this.precision triangles to depict a rod
        // every triangle has 3 vertices, so we need to multiply 3
        // every point needs 2 numbers to describe its texture coordinate coordinate
    
        for (var i = 0; i < this.precision; i++) {
            // for the bottom face
            coordinate[6 * i + 0] = (i + 0.5) / this.precision;
            coordinate[6 * i + 1] = 1;
            coordinate[6 * i + 2] = i / this.precision;
            coordinate[6 * i + 3] = (this.height + radius) / (this.height + 2 * radius);
            coordinate[6 * i + 4] = (i + 1) / this.precision;
            coordinate[6 * i + 5] = (this.height + radius) / (this.height + 2 * radius);
    
            // for the top face
            coordinate[6 * this.precision + 6 * i + 0] = (i + 0.5) / this.precision;
            coordinate[6 * this.precision + 6 * i + 1] = 0;
            coordinate[6 * this.precision + 6 * i + 2] = i / this.precision;
            coordinate[6 * this.precision + 6 * i + 3] = radius / (this.height + 2 * radius);
            coordinate[6 * this.precision + 6 * i + 4] = (i + 1) / this.precision;
            coordinate[6 * this.precision + 6 * i + 5] = radius / (this.height + 2 * radius);
    
            // for side face
            coordinate[12 * this.precision + 6 * i + 0] = i / this.precision;
            coordinate[12 * this.precision + 6 * i + 1] = (this.height + radius) / (this.height + 2 * radius);
            coordinate[12 * this.precision + 6 * i + 2] = i / this.precision;
            coordinate[12 * this.precision + 6 * i + 3] = radius / (this.height + 2 * radius);
            coordinate[12 * this.precision + 6 * i + 4] = (i + 1) / this.precision;
            coordinate[12 * this.precision + 6 * i + 5] = radius / (this.height + 2 * radius);
            coordinate[18 * this.precision + 6 * i + 0] = (i + 1) / this.precision;
            coordinate[18 * this.precision + 6 * i + 1] = radius / (this.height + 2 * radius);
            coordinate[18 * this.precision + 6 * i + 2] = i / this.precision;
            coordinate[18 * this.precision + 6 * i + 3] = (this.height + radius) / (this.height + 2 * radius);
            coordinate[18 * this.precision + 6 * i + 4] = (i + 1) / this.precision;
            coordinate[18 * this.precision + 6 * i + 5] = (this.height + radius) / (this.height + 2 * radius);
        }
    
        return coordinate;
    }
    
    /**
     * compute shadow map
     */
    Rod.prototype.drawBefore = function(drawingState) {
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
    Rod.prototype.draw = function(drawingState) {
        // we make a model matrix to place the rod in the world
        var modelM = m4.identity();
        m4.setTranslation(modelM, this.position, modelM);
        var modelViewM = m4.multiply(modelM, drawingState.view);
        var normalM = m4.inverse(m4.transpose(modelViewM));
        var MVP = m4.multiply(m4.multiply(modelM, drawingState.lightView), drawingState.lightProjection);
        
        var gl = drawingState.gl;

        // choose the shader program we have compiled
        gl.useProgram(shaderProgram);

        // we need to enable the attributes we had set up, which are set disabled by default by system
        gl.enableVertexAttribArray(shaderProgram.PositionAttribute);
        gl.enableVertexAttribArray(shaderProgram.NormalAttribute);
        gl.enableVertexAttribArray(shaderProgram.TexCoordAttribute);

        // set the uniforms
        gl.uniformMatrix4fv(shaderProgram.ModelViewLoc, false, modelViewM);
        gl.uniformMatrix4fv(shaderProgram.ProjectionLoc, false, drawingState.projection);
        gl.uniformMatrix4fv(shaderProgram.NormalMatrixLoc, false, normalM);
        gl.uniformMatrix4fv(shaderProgram.MVPFromLightLoc, false, MVP);
        gl.uniform3fv(shaderProgram.LightDirectionLoc, drawingState.lightDirection);
        gl.uniform3fv(shaderProgram.LightColorLoc, drawingState.lightColor);
        gl.uniform1i(shaderProgram.ShadowMapLoc, 0); // we will store the shadow map in TMU0 soon, so instruct shader
        // programs to use use TMU0
        gl.uniform1i(shaderProgram.TexSamplerLoc, 1); // so we will store the image texture in TMU1 soon

        // connect the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(shaderProgram.PositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(shaderProgram.NormalAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.TexCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0); // bind our shadow map to TMU0
        gl.bindTexture(gl.TEXTURE_2D, drawingState.shadowMap);
        gl.activeTexture(gl.TEXTURE1); // store wood texture in TMU1
	    gl.bindTexture(gl.TEXTURE_2D, texture);

	    // Do the drawing
        gl.drawArrays(gl.TRIANGLES, 0, vertexPos.length / 3);

        // WebGL is a state machine, so do not forget to disable all attributes after every drawing
        gl.disableVertexAttribArray(shaderProgram.PositionAttribute);
        gl.disableVertexAttribArray(shaderProgram.NormalAttribute);
        gl.disableVertexAttribArray(shaderProgram.TexCoordAttribute);
    }

    /**
     * return the number of discs appending on it
     */
    Rod.prototype.getNumberOfDiscs = function() {
        return this.stackOfDiscs.length;
    }

    /**
      * return the center position in model coordinate for examination
      */
    Rod.prototype.center = function(drawingState) {
        return v3.add(this.position, [0, this.height / 2, 0]);
    }

})();