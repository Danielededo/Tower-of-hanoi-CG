'use strict';

// allow the constructor to be "leaked" out
var Rod = undefined;

// now, I make a function that adds an object to that list. There's a funky thing here where I have to not only define
// the function, but also run it - so it has to be put in parenthesis
(function() {

    // Read shader source
    /*var vertexSource = `#version 300 es

    in vec3 vPosition;
    in vec3 vNormal;
    in vec2 vTexCoord;
    uniform mat4 uModelView;
    uniform mat4 uProjection;
    uniform mat4 uNormal;
    uniform mat4 uMVPFromLight;
    out vec3 fNormal;
    out vec3 fPosition;
    out vec2 fTexCoord;
    out vec4 vPositionFromLight;

    void main(void) {
        vPositionFromLight = uMVPFromLight * vec4(vPosition, 1.0); // compute position in light coordinate
        fNormal = (uNormal * vec4(vNormal, 1.0)).xyz; // normals in camera coordinate
        fPosition = (uModelView * vec4(vPosition, 1.0)).xyz; // vertex position in camera coordinate
        fTexCoord = vTexCoord;
        gl_Position = uProjection * uModelView * vec4(vPosition, 1.0);
    }`;
    var fragmentSource = `#version 300 es

    
    #ifdef GL_ES
       precision highp float;
   #endif
   uniform vec3 uLightDirection;
   uniform vec3 uLightColor;
   uniform sampler2D uShadowMap; // depth value in light coordinate
   uniform sampler2D uTexSampler;
   in vec3 fNormal;
   in vec3 fPosition; // vertex position in camera coordinate
   in vec2 fTexCoord;
   in vec4 vPositionFromLight;
   out vec4 myOutputColor;
  
   vec2 blinnPhongShading(vec3 lightDirection, float lightIntensity, float ambientCoefficient,
       float diffuseCoefficient, float specularCoefficient, float specularExponent)
   {
       lightDirection = normalize(lightDirection);
       vec3 eyeDirection = normalize(-fPosition);
       vec3 normal = normalize(fNormal);
       vec3 halfVector = normalize(eyeDirection + lightDirection);
       float ambientAndDiffuse = ambientCoefficient + diffuseCoefficient * lightIntensity * max(0.0, dot(normal,
           lightDirection));
       float specular = specularCoefficient * pow(max(0.0, dot(normal, halfVector)), specularExponent);
       return vec2(ambientAndDiffuse, specular);
   }

   
   float unpackDepth(const in vec4 rgbaDepth) {
       const vec4 bitShift = vec4(1.0, 1.0 / 256.0, 1.0 / (256.0 * 256.0), 1.0 / (256.0 * 256.0 * 256.0));
       float depth = dot(rgbaDepth, bitShift);
       return depth;
   }

   void main(void) {
       vec3 shadowCoordinate = (vPositionFromLight.xyz / vPositionFromLight.w) / 2.0 + 0.5;
       vec4 rgbaDepth = texture(uShadowMap, shadowCoordinate.xy);
       float depth = unpackDepth(rgbaDepth); // decode the depth value from the depth map
       float visibility = (shadowCoordinate.z > depth + 0.00001) ? 0.7 : 1.0;
       vec2 light = blinnPhongShading(uLightDirection, 1.0, 0.5, 1.0, 1.5, 100.0);
       vec3 ambientAndDiffuseColor = light.x * texture(uTexSampler, fTexCoord).xyz;
       vec3 specularColor = light.y * uLightColor;
       myOutputColor = vec4(visibility * (ambientAndDiffuseColor + specularColor), 1.0);
   }`;*/

    // compile the shaders only when initializing every object
    // we do not have to recompile them during drawing in every frame


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
        this.color = color || normalizeRgb(0, 0, 0); // Black by default. However I use image texture for
        // rods so this.color is not used
        this.stackOfDiscs = []; // store discs
    }

    /**
     * compile the corresponding shader program and generate all data unchanged between two frames
     */
    Rod.prototype.initialize = function(drawingState) {
        var gl = drawingState.gl; // an abbreviation...

        
            /*// Compile vertex shader
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
            }*/

            // with the vertex shader, we need to pass it positions as an attribute - so set up that communication
            shaderProgram[0].PositionAttribute = gl.getAttribLocation(shaderProgram[0], 'vPosition');
            shaderProgram[0].NormalAttribute = gl.getAttribLocation(shaderProgram[0], 'vNormal');
            shaderProgram[0].TexCoordAttribute = gl.getAttribLocation(shaderProgram[0], 'vTexCoord');

            // this gives us access to uniforms
            shaderProgram[0].ModelViewLoc = gl.getUniformLocation(shaderProgram[0], 'uModelView');
            shaderProgram[0].ProjectionLoc = gl.getUniformLocation(shaderProgram[0], 'uProjection');
            shaderProgram[0].NormalMatrixLoc = gl.getUniformLocation(shaderProgram[0], 'uNormal');
            shaderProgram[0].MVPFromLightLoc = gl.getUniformLocation(shaderProgram[0], 'uMVPFromLight');
            shaderProgram[0].LightDirectionLoc = gl.getUniformLocation(shaderProgram[0], 'uLightDirection');
            shaderProgram[0].LightColorLoc = gl.getUniformLocation(shaderProgram[0], 'uLightColor');
            shaderProgram[0].ShadowMapLoc = gl.getUniformLocation(shaderProgram[0], 'uShadowMap');
            shaderProgram[0].TexSamplerLoc = gl.getUniformLocation(shaderProgram[0], 'uTexSampler');

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
            // for the bottom face the mesh used is triangle fan
            position[9 * i + 0] = 0;
            position[9 * i + 1] = 0;
            position[9 * i + 2] = 0;
            position[9 * i + 3] = radius * Math.sin(i / this.precision * 2 * Math.PI);
            position[9 * i + 4] = 0;
            position[9 * i + 5] = radius * Math.cos(i / this.precision * 2 * Math.PI);
            position[9 * i + 6] = radius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
            position[9 * i + 7] = 0;
            position[9 * i + 8] = radius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
    
            // for the top face the mesh used is triangle fan
            position[9 * this.precision + 9 * i + 0] = 0;
            position[9 * this.precision + 9 * i + 1] = this.height;
            position[9 * this.precision + 9 * i + 2] = 0;
            position[9 * this.precision + 9 * i + 3] = radius * Math.sin(i / this.precision * 2 * Math.PI);
            position[9 * this.precision + 9 * i + 4] = this.height;
            position[9 * this.precision + 9 * i + 5] = radius * Math.cos(i / this.precision * 2 * Math.PI);
            position[9 * this.precision + 9 * i + 6] = radius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
            position[9 * this.precision + 9 * i + 7] = this.height;
            position[9 * this.precision + 9 * i + 8] = radius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
    
            // for side face the mesh used is triangle strip
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
    Rod.prototype.draw = function(drawingState) {
        // we make a model matrix to place the rod in the world
        var modelM = twgl.m4.identity();
        twgl.m4.setTranslation(modelM, this.position, modelM);
        var modelViewM = twgl.m4.multiply(modelM, drawingState.view);
        var normalM = twgl.m4.inverse(twgl.m4.transpose(modelViewM));
        var MVP = twgl.m4.multiply(twgl.m4.multiply(modelM, drawingState.lightView), drawingState.lightProjection);
        
        var gl = drawingState.gl;

        // choose the shader program we have compiled
        gl.useProgram(shaderProgram[0]);

        // we need to enable the attributes we had set up, which are set disabled by default by system
        gl.enableVertexAttribArray(shaderProgram[0].PositionAttribute);
        gl.enableVertexAttribArray(shaderProgram[0].NormalAttribute);
        gl.enableVertexAttribArray(shaderProgram[0].TexCoordAttribute);

        // set the uniforms
        gl.uniformMatrix4fv(shaderProgram[0].ModelViewLoc, false, modelViewM);
        gl.uniformMatrix4fv(shaderProgram[0].ProjectionLoc, false, drawingState.projection);
        gl.uniformMatrix4fv(shaderProgram[0].NormalMatrixLoc, false, normalM);
        gl.uniformMatrix4fv(shaderProgram[0].MVPFromLightLoc, false, MVP);
        gl.uniform3fv(shaderProgram[0].LightDirectionLoc, drawingState.lightDirection);
        gl.uniform3fv(shaderProgram[0].LightColorLoc, drawingState.lightColor);
        gl.uniform1i(shaderProgram[0].ShadowMapLoc, 0); // we will store the shadow map in TMU0 soon, so instruct shader
        // programs to use use TMU0
        gl.uniform1i(shaderProgram[0].TexSamplerLoc, 1); // so we will store the image texture in TMU1 soon

        // connect the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.vertexAttribPointer(shaderProgram[0].PositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(shaderProgram[0].NormalAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.vertexAttribPointer(shaderProgram[0].TexCoordAttribute, 2, gl.FLOAT, false, 0, 0);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0); // bind our shadow map to TMU0
        gl.bindTexture(gl.TEXTURE_2D, drawingState.shadowMap);
        gl.activeTexture(gl.TEXTURE1); // store wood texture in TMU1
	    gl.bindTexture(gl.TEXTURE_2D, texture);

	    // Do the drawing
        gl.drawArrays(gl.TRIANGLES, 0, vertexPos.length / 3);

        // WebGL is a state machine, so do not forget to disable all attributes after every drawing
        gl.disableVertexAttribArray(shaderProgram[0].PositionAttribute);
        gl.disableVertexAttribArray(shaderProgram[0].NormalAttribute);
        gl.disableVertexAttribArray(shaderProgram[0].TexCoordAttribute);
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
        return twgl.v3.add(this.position, [0, this.height / 2, 0]);
    }

})();