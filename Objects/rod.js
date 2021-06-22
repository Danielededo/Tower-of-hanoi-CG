'use strict';

var Rod = undefined;

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
    this.diameter = diameter || 0.2;
    this.height = height || 0.6;
    this.precision = precision || 0.5;
    this.color = color || [0, 0, 0]; // black by default
    this.stackOfDiscs = []; // store discs
}

Rod.prototype.initialize = function(drawingState) {
    var gl = drawingState.gl;

    shaderProgram[0].PositionAttribute = gl.getAttribLocation(shaderProgram[0], 'vPosition'); // vPosition represents the position of the primitives
    shaderProgram[0].NormalAttribute = gl.getAttribLocation(shaderProgram[0], 'vNormal'); // vNormal represents the normals of the primitives
    shaderProgram[0].TexCoordAttribute = gl.getAttribLocation(shaderProgram[0], 'vTexCoord'); // vTextCoord represents the texture coords of the primitives
    
    // vertex shader uniforms
    shaderProgram[0].ModelLoc = gl.getUniformLocation(shaderProgram[0], 'uModel');
    shaderProgram[0].ViewLoc = gl.getUniformLocation(shaderProgram[0], 'uView');
    shaderProgram[0].ProjectionLoc = gl.getUniformLocation(shaderProgram[0], 'uProjection');
    shaderProgram[0].NormalMatrixLoc = gl.getUniformLocation(shaderProgram[0], 'uNormal');
    
    // fragment shader uniforms
    shaderProgram[0].ColorLoc = gl.getUniformLocation(shaderProgram[0], 'uColor');
    
    shaderProgram[0].TexSamplerLoc = gl.getUniformLocation(shaderProgram[0], 'uTexSampler');

    shaderProgram[0].DiffuseTypeLoc = gl.getUniformLocation(shaderProgram[0], 'uDiffuseType');
    shaderProgram[0].uSpecularTypeLoc = gl.getUniformLocation(shaderProgram[0], 'uSpecularType');
    shaderProgram[0].LightDecayLoc = gl.getUniformLocation(shaderProgram[0], 'uLightDecay');
    shaderProgram[0].LightTargetLoc = gl.getUniformLocation(shaderProgram[0], 'uLightTarget');
    shaderProgram[0].LightTypeLoc = gl.getUniformLocation(shaderProgram[0], 'uLightType');

    shaderProgram[0].LightPositionLoc = gl.getUniformLocation(shaderProgram[0], 'uLightPosition');
    shaderProgram[0].LightDirectionLoc = gl.getUniformLocation(shaderProgram[0], 'uLightDirection');
    shaderProgram[0].LightColorLoc = gl.getUniformLocation(shaderProgram[0], 'uLightColor');
    shaderProgram[0].AmbientLightColorLoc = gl.getUniformLocation(shaderProgram[0], 'uAmbientLightColor');

    shaderProgram[0].RodTextureLevelLoc = gl.getUniformLocation(shaderProgram[0], 'uRodTextureLevel');

    shaderProgram[0].DiffuseColorLoc = gl.getUniformLocation(shaderProgram[0], 'uDiffuseColor');
    shaderProgram[0].SpecShineLoc = gl.getUniformLocation(shaderProgram[0], 'uSpecShine');
    shaderProgram[0].DToonThLoc = gl.getUniformLocation(shaderProgram[0], 'uDToonTh');
    shaderProgram[0].SToonThLoc = gl.getUniformLocation(shaderProgram[0], 'uSToonTh');

    shaderProgram[0].SpecularColorLoc = gl.getUniformLocation(shaderProgram[0], 'uSpecularColor');
    shaderProgram[0].Eye = gl.getUniformLocation(shaderProgram[0], 'uEye');

    // data
    // vertex positions
    this.vertexPos = this.generateLocalPosition();
    // create buffer and upload data
    this.positionBuffer = gl.createBuffer(); // create vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer); // vbo buffer is set as the active one, ARRAY_BUFFER means it holds vertex coords
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexPos), gl.STATIC_DRAW); // vertex data are placed inside the buffer

    // normals
    this.normal = this.generateNormal();
    // create buffer and upload data
    this.normalBuffer = gl.createBuffer(); // create normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normal), gl.STATIC_DRAW); // normal data are placed inside the buffer

    // texture coordinates
    this.texCoord = this.generateTextureCoordinate();

    // create buffer and upload data
    this.texCoordBuffer = gl.createBuffer(); // create texture buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.texCoord), gl.STATIC_DRAW); // texture data are placed inside the buffer

    // set up texture
    this.texture = gl.createTexture();

    // load texture. Following two lines are critical for binding our texture object and the image
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, LoadedImageFiles["woodTexture.jpg"]);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
}

// create a rod in model coordinate
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

// generate all normal vectors of a rod surface
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

// generate all texture coordinate of a rod surface
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

// draw on the screen
Rod.prototype.draw = function(drawingState) {

    var modelM = twgl.m4.identity();
    twgl.m4.setTranslation(modelM, this.position, modelM); // M = modelMatrix = worldMatrix, from object space to world space

    var normalM = twgl.m4.inverse(twgl.m4.transpose(modelM));
    
    var gl = drawingState.gl;

    // choose the shader (glsl) program we have compiled
    gl.useProgram(shaderProgram[0]);

    // we need to enable the attributes we had set up, which are set disabled by default by system
    gl.enableVertexAttribArray(shaderProgram[0].PositionAttribute);
    gl.enableVertexAttribArray(shaderProgram[0].NormalAttribute);
    gl.enableVertexAttribArray(shaderProgram[0].TexCoordAttribute);

    // set the uniforms
    gl.uniformMatrix4fv(shaderProgram[0].ModelLoc, false, modelM);
    gl.uniformMatrix4fv(shaderProgram[0].ViewLoc, false, drawingState.view);
    gl.uniformMatrix4fv(shaderProgram[0].ProjectionLoc, false, drawingState.projection);
    gl.uniformMatrix4fv(shaderProgram[0].NormalMatrixLoc, false, normalM);

    gl.uniform1i(shaderProgram[0].TexSamplerLoc, 1); // so we will store the image texture

    gl.uniform2fv(shaderProgram[0].DiffuseTypeLoc, diffuseType);
    gl.uniform3fv(shaderProgram[0].uSpecularTypeLoc, specularType);
    gl.uniform1f(shaderProgram[0].LightDecayLoc, drawingState.lightDecay);
    gl.uniform1f(shaderProgram[0].LightTargetLoc, drawingState.lightTarget);
    gl.uniform2fv(shaderProgram[0].LightTypeLoc, lightType);
    
    gl.uniform3fv(shaderProgram[0].LightPositionLoc, drawingState.lightPosition);
    gl.uniform3fv(shaderProgram[0].LightDirectionLoc, drawingState.lightDirection);
    gl.uniform3fv(shaderProgram[0].LightColorLoc, drawingState.lightColor);

    gl.uniform3fv(shaderProgram[0].ColorLoc, this.color);
    
    var col = document.getElementById("ambientLightColor").value.substring(1,7);
    var R = parseInt(col.substring(0,2) ,16) / 255;
    var G = parseInt(col.substring(2,4) ,16) / 255;
    var B = parseInt(col.substring(4,6) ,16) / 255;
    gl.uniform3f(shaderProgram[0].AmbientLightColorLoc, R,G,B);

    var text = document.getElementById("rodTextureLevel").value/100.0;
    gl.uniform1f(shaderProgram[0].RodTextureLevelLoc, text);

    gl.uniform3fv(shaderProgram[0].DiffuseColorLoc, drawingState.diffuseColor);
    gl.uniform1f(shaderProgram[0].SpecShineLoc, drawingState.specShine);
    gl.uniform1f(shaderProgram[0].DToonThLoc, drawingState.DToonTh);
    gl.uniform1f(shaderProgram[0].SToonThLoc, drawingState.SToonTh);

    gl.uniform3fv(shaderProgram[0].SpecularColorLoc, drawingState.specularColor);
    gl.uniform3fv(shaderProgram[0].Eye, drawingState.eye);
    
    // connect the attributes to the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(shaderProgram[0].PositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(shaderProgram[0].NormalAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(shaderProgram[0].TexCoordAttribute, 2, gl.FLOAT, false, 0, 0);

    // bind the texture
    gl.activeTexture(gl.TEXTURE1); // store wood texture
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // do the drawing
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexPos.length / 3); // the last parameter specifies how many vertices to draw

    // WebGL is a state machine, all attributes must be disabled after every drawing
    gl.disableVertexAttribArray(shaderProgram[0].PositionAttribute);
    gl.disableVertexAttribArray(shaderProgram[0].NormalAttribute);
    gl.disableVertexAttribArray(shaderProgram[0].TexCoordAttribute);
}

// return the number of discs into a rod
Rod.prototype.getNumberOfDiscs = function() {
    return this.stackOfDiscs.length;
}