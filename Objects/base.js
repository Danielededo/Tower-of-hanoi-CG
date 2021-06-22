'use strict';

var Base = undefined;

/**
 * constructor for the base
 * @param name: a unique name
 * @param position: the position of the center
 * @param width: the width of the base
 * @param depth: the depth of the base
 * @param height: the height of the base
 * @param color: a 3 dimension Float32Array storing r, g, b values ranged from 0 to 1 for shaders
 */
 Base = function Base(name, position, width, depth, height, color) {
    this.name = name || 'base';
    this.position = position || [0.0, 0.0, 0.0];
    this.width = width || 6.0;
    this.depth = depth || 2.0;
    this.height = height || 0.1;
    this.color = color || [0, 0, 0]; // black by default
}

Base.prototype.initialize = function(drawingState) {
    var gl = drawingState.gl;

    shaderProgram[2].PositionAttribute = gl.getAttribLocation(shaderProgram[2], 'vPosition'); // vPosition represents the position of the primitives
    shaderProgram[2].NormalAttribute = gl.getAttribLocation(shaderProgram[2], 'vNormal'); // vNormal represents the normals of the primitives

    // vertex shader uniforms
    shaderProgram[2].ModelLoc = gl.getUniformLocation(shaderProgram[2], 'uModel');
    shaderProgram[2].ViewLoc = gl.getUniformLocation(shaderProgram[2], 'uView');
    shaderProgram[2].ProjectionLoc = gl.getUniformLocation(shaderProgram[2], 'uProjection');
    shaderProgram[2].NormalMatrixLoc = gl.getUniformLocation(shaderProgram[2], 'uNormal');
    
    // fragment shader uniforms
    shaderProgram[2].ColorLoc = gl.getUniformLocation(shaderProgram[2], 'uColor');

    shaderProgram[2].DiffuseTypeLoc = gl.getUniformLocation(shaderProgram[2], 'uDiffuseType');
    shaderProgram[2].uSpecularTypeLoc = gl.getUniformLocation(shaderProgram[2], 'uSpecularType');
    shaderProgram[2].LightDecayLoc = gl.getUniformLocation(shaderProgram[2], 'uLightDecay');
    shaderProgram[2].LightTargetLoc = gl.getUniformLocation(shaderProgram[2], 'uLightTarget');
    shaderProgram[2].LightTypeLoc = gl.getUniformLocation(shaderProgram[2], 'uLightType');

    shaderProgram[2].LightPositionLoc = gl.getUniformLocation(shaderProgram[2], 'uLightPosition');
    shaderProgram[2].LightDirectionLoc = gl.getUniformLocation(shaderProgram[2], 'uLightDirection');
    shaderProgram[2].LightColorLoc = gl.getUniformLocation(shaderProgram[2], 'uLightColor');
    shaderProgram[2].AmbientLightColorLoc = gl.getUniformLocation(shaderProgram[2], 'uAmbientLightColor');
    
    shaderProgram[2].DiffuseColorLoc = gl.getUniformLocation(shaderProgram[2], 'uDiffuseColor');
    shaderProgram[2].SpecShineLoc = gl.getUniformLocation(shaderProgram[2], 'uSpecShine');
    shaderProgram[2].DToonThLoc = gl.getUniformLocation(shaderProgram[2], 'uDToonTh');
    shaderProgram[2].SToonThLoc = gl.getUniformLocation(shaderProgram[2], 'uSToonTh');

    shaderProgram[2].SpecularColorLoc = gl.getUniformLocation(shaderProgram[2], 'uSpecularColor');
    shaderProgram[2].Eye = gl.getUniformLocation(shaderProgram[2], 'uEye');

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

    // for the base we have no texture
}

// create a base in model coordinate
Base.prototype.generateLocalPosition = function() {

    var position = new Float32Array(3 * 3 * 12);
    // we need 2 triangles per face (6 faces): 12 triangles
    // every triangle has 3 vertices, so we need to multiply 3
    // every point needs 3 numbers to describe its position in 3D coordinates

    var x = this.width/2;
    var minus_y = -(this.height/2);
    var z = this.depth/2;

    position = [
		// face 1
		-x, 0, -z,
		x, minus_y, -z,
		x, 0, -z,
		-x, minus_y, -z,
		-x, 0, -z,
		x, minus_y, -z,
		// face 2
		-x, minus_y, z,
		-x, 0, z,
		x, minus_y, z,
		-x, 0, z,
		x, minus_y, z,
		x, 0, z,
		// face 3
		x, minus_y, -z,
		x, minus_y, z,
		x, 0, z,
		x, minus_y, -z,
		x, 0, z,
		x, 0, -z,
		// face 4
		-x, minus_y, -z,
		-x, minus_y, z,
		-x, 0, z,
		-x, minus_y, -z,
		-x, 0, z,
		-x, 0, -z,
		// face 5
		-x, 0, -z,
		x, 0, -z,
		x, 0, z,
		-x, 0, -z,
		-x, 0, z,
		x, 0, z,
		// face 6
		-x, minus_y, -z,
		x, minus_y, -z,
		x, minus_y, z,
		-x, minus_y, -z,
		-x, minus_y, z,
		x, minus_y, z
	];

    return position;
}

// generate all normal vectors of a base surface
Base.prototype.generateNormal = function() {
    var normal = new Float32Array(3 * 3 * 12);

    normal = [
        0,0,-1,
        0,0,-1,
        0,0,-1,
        0,0,-1,
        0,0,-1,
        0,0,-1,

        0,0,1,
        0,0,1,
        0,0,1,
        0,0,1,
        0,0,1,
        0,0,1,

        1,0,0,
        1,0,0,
        1,0,0,
        1,0,0,
        1,0,0,
        1,0,0,

        -1,0,0,
        -1,0,0,
        -1,0,0,
        -1,0,0,
        -1,0,0,
        -1,0,0,

        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,

        0,-1,0,
        0,-1,0,
        0,-1,0,
        0,-1,0,
        0,-1,0,
        0,-1,0,
    ];

    return normal;
}


// draw on the screen
Base.prototype.draw = function(drawingState) {
    
    var modelM = twgl.m4.identity();
    twgl.m4.setTranslation(modelM, this.position, modelM); // M = modelMatrix = worldMatrix, from object space to world space

    var normalM = twgl.m4.inverse(twgl.m4.transpose(modelM));

    var gl = drawingState.gl;

    // choose the shader (glsl) program we have compiled
    gl.useProgram(shaderProgram[2]);

    // we need to enable the attributes we had set up, which are set disabled by default by system
    gl.enableVertexAttribArray(shaderProgram[2].PositionAttribute);
    gl.enableVertexAttribArray(shaderProgram[2].NormalAttribute);

    // set the uniforms
    gl.uniformMatrix4fv(shaderProgram[2].ModelLoc, false, modelM);
    gl.uniformMatrix4fv(shaderProgram[2].ViewLoc, false, drawingState.view);
    gl.uniformMatrix4fv(shaderProgram[2].ProjectionLoc, false, drawingState.projection);
    gl.uniformMatrix4fv(shaderProgram[2].NormalMatrixLoc, false, normalM);

    gl.uniform3fv(shaderProgram[2].ColorLoc, this.color);

    gl.uniform2fv(shaderProgram[2].DiffuseTypeLoc, diffuseType);
    gl.uniform3fv(shaderProgram[2].uSpecularTypeLoc, specularType);
    gl.uniform1f(shaderProgram[2].LightDecayLoc, drawingState.lightDecay);
    gl.uniform1f(shaderProgram[2].LightTargetLoc, drawingState.lightTarget);
    gl.uniform2fv(shaderProgram[2].LightTypeLoc, lightType);

    gl.uniform3fv(shaderProgram[2].LightPositionLoc, drawingState.lightPosition);
    gl.uniform3fv(shaderProgram[2].LightDirectionLoc, drawingState.lightDirection);
    gl.uniform3fv(shaderProgram[2].LightColorLoc, drawingState.lightColor);

    var col = document.getElementById("ambientLightColor").value.substring(1,7);
    var R = parseInt(col.substring(0,2) ,16) / 255;
    var G = parseInt(col.substring(2,4) ,16) / 255;
    var B = parseInt(col.substring(4,6) ,16) / 255;
    gl.uniform3f(shaderProgram[2].AmbientLightColorLoc, R,G,B);

    gl.uniform3fv(shaderProgram[2].DiffuseColorLoc, drawingState.diffuseColor);
    gl.uniform1f(shaderProgram[2].SpecShineLoc, drawingState.specShine);
    gl.uniform1f(shaderProgram[2].DToonThLoc, drawingState.DToonTh);
    gl.uniform1f(shaderProgram[2].SToonThLoc, drawingState.SToonTh);

    gl.uniform3fv(shaderProgram[2].SpecularColorLoc, drawingState.specularColor);
    gl.uniform3fv(shaderProgram[2].Eye, drawingState.eye);

    // connect the attributes to the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(shaderProgram[2].PositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(shaderProgram[2].NormalAttribute, 3, gl.FLOAT, false, 0, 0);

    // do the drawing
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexPos.length / 3); // the last parameter specifies how many vertices to draw

    // WebGL is a state machine, all attributes must be disabled after every drawing
    gl.disableVertexAttribArray(shaderProgram[2].PositionAttribute);
    gl.disableVertexAttribArray(shaderProgram[2].NormalAttribute);
}