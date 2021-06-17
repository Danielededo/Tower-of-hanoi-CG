'use strict';

var Disc = undefined;

// As to rod, since every rod is identical, we could put vertexPos, normal and such things outside function init
// so that we only create buffers once for every rod to save time.
// As to discs, their size are different so data in buffers varies. We have to use this.vertexPos, this.normal and
// so on inside function init.

var discIndex = 1; // for the constructor of disc
/**
 * constructor for square Disc
 * @param name: a unique name
 * @param position: the position of the center of the ground in world coordinate
 * @param outerDiameter: outer diameter of the top face and the bottom face
 * @param innerDiameter: inner diameter of the top face and the bottom face
 * @param height: height of disc
 * @param precision: the number of triangles in the top face to simulate a circle
 * @param color: a 3 dimension Float32Array storing r, g, b value ranged from 0 to 1 for shaders
 */
Disc = function Disc(name, position, outerDiameter, innerDiameter, height, precision, color) {
    this.name = name || 'disc' + discIndex++;;
    this.position = position || [0.0, 0.0, 0.0];
    this.outerDiameter = outerDiameter || 60;
    this.innerDiameter = innerDiameter || 20;
    this.height = height || 10;
    this.precision = precision || 50;
    this.color = color || normalizeRgb(0, 0, 0); // black by default
}

/**
 * compile the corresponding shader program and generate all data unchanged between two frames
 */
Disc.prototype.initialize = function(drawingState) {
    var gl = drawingState.gl;

    // with the vertex shader, we need to pass it positions as an attribute - so set up that communication
    shaderProgram[1].PositionAttribute = gl.getAttribLocation(shaderProgram[1], 'vPosition'); // vPosition represents the position of the primitives
    shaderProgram[1].NormalAttribute = gl.getAttribLocation(shaderProgram[1], 'vNormal'); // vNormal represents the normals of the primitives

    // vertex shader uniforms
    shaderProgram[1].ModelLoc = gl.getUniformLocation(shaderProgram[1], 'uModel');
    shaderProgram[1].ViewLoc = gl.getUniformLocation(shaderProgram[1], 'uView');
    shaderProgram[1].ProjectionLoc = gl.getUniformLocation(shaderProgram[1], 'uProjection');
    shaderProgram[1].NormalMatrixLoc = gl.getUniformLocation(shaderProgram[1], 'uNormal');
    // fragment shader uniforms
    shaderProgram[1].ColorLoc = gl.getUniformLocation(shaderProgram[1], 'uColor');

    shaderProgram[1].DiffuseTypeLoc = gl.getUniformLocation(shaderProgram[1], 'uDiffuseType');
    shaderProgram[1].uSpecularTypeLoc = gl.getUniformLocation(shaderProgram[1], 'uSpecularType');
    shaderProgram[1].LightConeOutLoc = gl.getUniformLocation(shaderProgram[1], 'uLightConeOut');
    shaderProgram[1].LightConeInLoc = gl.getUniformLocation(shaderProgram[1], 'uLightConeIn');
    shaderProgram[1].LightDecayLoc = gl.getUniformLocation(shaderProgram[1], 'uLightDecay');
    shaderProgram[1].LightTargetLoc = gl.getUniformLocation(shaderProgram[1], 'uLightTarget');
    shaderProgram[1].LightTypeLoc = gl.getUniformLocation(shaderProgram[1], 'uLightType');

    shaderProgram[1].LightPositionLoc = gl.getUniformLocation(shaderProgram[1], 'uLightPosition');
    shaderProgram[1].LightDirectionLoc = gl.getUniformLocation(shaderProgram[1], 'uLightDirection');
    shaderProgram[1].LightColorLoc = gl.getUniformLocation(shaderProgram[1], 'uLightColor');
    shaderProgram[1].AmbientLightColorLoc = gl.getUniformLocation(shaderProgram[1], 'uAmbientLightColor');

    
    shaderProgram[1].DiffuseColorLoc = gl.getUniformLocation(shaderProgram[1], 'uDiffuseColor');
    shaderProgram[1].SpecShineLoc = gl.getUniformLocation(shaderProgram[1], 'uSpecShine');
    shaderProgram[1].DToonThLoc = gl.getUniformLocation(shaderProgram[1], 'uDToonTh');
    shaderProgram[1].SToonThLoc = gl.getUniformLocation(shaderProgram[1], 'uSToonTh');

    shaderProgram[1].SpecularColorLoc = gl.getUniformLocation(shaderProgram[1], 'uSpecularColor');
    shaderProgram[1].Eye = gl.getUniformLocation(shaderProgram[1], 'uEye');

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

    // here no texture
}

/**
 * create a disc in model coordinate <br/>
 * People use 3ds Max, cinema 4d or other tools to create models in industry but I do not have any tools so I have 
 * to create models by JavaScript codes. <br/>
 * All models are created before the drawing procedure, so if you want to shorten the waiting time before you see
 * anything on screen, you could use any tool mentioned above to draw a rod (3 rods are identical so you could only
 * draw one of them) and 4 discs and export 5 separate WaveFront obj files. Then you could use create_vertex_list.py
 * to extract concrete numbers stored in obj files and copy there numbers into functions init for variables 
 * vertexPos, normal and texCoord.
 * @return: a Float32Array contains all vertices
 */
Disc.prototype.generateLocalPosition = function() {
    var outerRadius = this.outerDiameter / 2;
    var innerRadius = this.innerDiameter / 2;

    var position = new Float32Array(3 * 3 * 8 * this.precision);
    // we need 8 because there are 2+2+2+2 triangles in every cycle
    // we need 8 * this.precision triangles to depict a disc
    // every triangle has 3 vertices, so we need to multiply 3
    // every point needs 3 numbers to describe its position in 3D coordinate

    for (var i = 0; i < this.precision; i++) {
        // for the bottom face the mesh used is triangle strip
        position[9 * i + 0] = innerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[9 * i + 1] = 0;
        position[9 * i + 2] = innerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[9 * i + 3] = outerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[9 * i + 4] = 0;
        position[9 * i + 5] = outerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[9 * i + 6] = outerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[9 * i + 7] = 0;
        position[9 * i + 8] = outerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
        position[9 * this.precision + 9 * i + 0] = innerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[9 * this.precision + 9 * i + 1] = 0;
        position[9 * this.precision + 9 * i + 2] = innerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[9 * this.precision + 9 * i + 3] = innerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[9 * this.precision + 9 * i + 4] = 0;
        position[9 * this.precision + 9 * i + 5] = innerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
        position[9 * this.precision + 9 * i + 6] = outerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[9 * this.precision + 9 * i + 7] = 0;
        position[9 * this.precision + 9 * i + 8] = outerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);

        // for the top face the mesh used is triangle strip
        position[18 * this.precision + 9 * i + 0] = innerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[18 * this.precision + 9 * i + 1] = this.height;
        position[18 * this.precision + 9 * i + 2] = innerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[18 * this.precision + 9 * i + 3] = outerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[18 * this.precision + 9 * i + 4] = this.height;
        position[18 * this.precision + 9 * i + 5] = outerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[18 * this.precision + 9 * i + 6] = outerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[18 * this.precision + 9 * i + 7] = this.height;
        position[18 * this.precision + 9 * i + 8] = outerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
        position[27 * this.precision + 9 * i + 0] = innerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[27 * this.precision + 9 * i + 1] = this.height;
        position[27 * this.precision + 9 * i + 2] = innerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[27 * this.precision + 9 * i + 3] = innerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[27 * this.precision + 9 * i + 4] = this.height;
        position[27 * this.precision + 9 * i + 5] = innerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
        position[27 * this.precision + 9 * i + 6] = outerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[27 * this.precision + 9 * i + 7] = this.height;
        position[27 * this.precision + 9 * i + 8] = outerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);

        // for outer side face the mesh used is triangle strip
        position[36 * this.precision + 9 * i + 0] = outerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[36 * this.precision + 9 * i + 1] = 0;
        position[36 * this.precision + 9 * i + 2] = outerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[36 * this.precision + 9 * i + 3] = outerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[36 * this.precision + 9 * i + 4] = this.height;
        position[36 * this.precision + 9 * i + 5] = outerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[36 * this.precision + 9 * i + 6] = outerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[36 * this.precision + 9 * i + 7] = this.height;
        position[36 * this.precision + 9 * i + 8] = outerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
        position[45 * this.precision + 9 * i + 0] = outerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[45 * this.precision + 9 * i + 1] = this.height;
        position[45 * this.precision + 9 * i + 2] = outerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
        position[45 * this.precision + 9 * i + 3] = outerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[45 * this.precision + 9 * i + 4] = 0;
        position[45 * this.precision + 9 * i + 5] = outerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[45 * this.precision + 9 * i + 6] = outerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[45 * this.precision + 9 * i + 7] = 0;
        position[45 * this.precision + 9 * i + 8] = outerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);

        // for inner side face the mesh used is triangle strip (outerRadius is the double of innerRadius)
        position[54 * this.precision + 9 * i + 0] = innerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[54 * this.precision + 9 * i + 1] = 0;
        position[54 * this.precision + 9 * i + 2] = innerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[54 * this.precision + 9 * i + 3] = innerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[54 * this.precision + 9 * i + 4] = this.height;
        position[54 * this.precision + 9 * i + 5] = innerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[54 * this.precision + 9 * i + 6] = innerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[54 * this.precision + 9 * i + 7] = this.height;
        position[54 * this.precision + 9 * i + 8] = innerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
        position[63 * this.precision + 9 * i + 0] = innerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[63 * this.precision + 9 * i + 1] = this.height;
        position[63 * this.precision + 9 * i + 2] = innerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
        position[63 * this.precision + 9 * i + 3] = innerRadius * Math.sin(i / this.precision * 2 * Math.PI);
        position[63 * this.precision + 9 * i + 4] = 0;
        position[63 * this.precision + 9 * i + 5] = innerRadius * Math.cos(i / this.precision * 2 * Math.PI);
        position[63 * this.precision + 9 * i + 6] = innerRadius * Math.sin((i + 1) / this.precision * 2 * Math.PI);
        position[63 * this.precision + 9 * i + 7] = 0;
        position[63 * this.precision + 9 * i + 8] = innerRadius * Math.cos((i + 1) / this.precision * 2 * Math.PI);
    }

    return position;
}

/**
 * generate all normal vectors of a disc's surface
 * @return: a Float32Array contains every vertical's normal
*/
Disc.prototype.generateNormal = function() {
    var normal = new Float32Array(3 * 3 * 8 * this.precision);

    for (var i = 0; i < this.precision; i++) {
        for (var j = 0; j < 2; j++) {
            // for the bottom face
            normal[9 * i + 3 * j + 0] = 0;
            normal[9 * i + 3 * j + 1] = -1;
            normal[9 * i + 3 * j + 2] = 0;
            normal[9 * this.precision + 9 * i + 3 * j + 0] = 0;
            normal[9 * this.precision + 9 * i + 3 * j + 1] = -1;
            normal[9 * this.precision + 9 * i + 3 * j + 2] = 0;

            // for the top face
            normal[18 * this.precision + 9 * i + 3 * j + 0] = 0;
            normal[18 * this.precision + 9 * i + 3 * j + 1] = 1;
            normal[18 * this.precision + 9 * i + 3 * j + 2] = 0;
            normal[27 * this.precision + 9 * i + 3 * j + 0] = 0;
            normal[27 * this.precision + 9 * i + 3 * j + 1] = 1;
            normal[27 * this.precision + 9 * i + 3 * j + 2] = 0;

            // for outer side face
            normal[36 * this.precision + 9 * i + 3 * j + 0] = Math.sin((i + 0.5) / this.precision * 2 * Math.PI);
            normal[36 * this.precision + 9 * i + 3 * j + 1] = 0;
            normal[36 * this.precision + 9 * i + 3 * j + 2] = Math.cos((i + 0.5) / this.precision * 2 * Math.PI);
            normal[45 * this.precision + 9 * i + 3 * j + 0] = Math.sin((i + 0.5) / this.precision * 2 * Math.PI);
            normal[45 * this.precision + 9 * i + 3 * j + 1] = 0;
            normal[45 * this.precision + 9 * i + 3 * j + 2] = Math.cos((i + 0.5) / this.precision * 2 * Math.PI);

            // for inner side face
            normal[54 * this.precision + 9 * i + 3 * j + 0] = -Math.sin((i + 0.5) / this.precision * 2 * Math.PI);
            normal[54 * this.precision + 9 * i + 3 * j + 1] = 0;
            normal[54 * this.precision + 9 * i + 3 * j + 2] = -Math.cos((i + 0.5) / this.precision * 2 * Math.PI);
            normal[63 * this.precision + 9 * i + 3 * j + 0] = -Math.sin((i + 0.5) / this.precision * 2 * Math.PI);
            normal[63 * this.precision + 9 * i + 3 * j + 1] = 0;
            normal[63 * this.precision + 9 * i + 3 * j + 2] = -Math.cos((i + 0.5) / this.precision * 2 * Math.PI);
        }
    }

    return normal;
}


/**
 * draw on the screen
 */
Disc.prototype.draw = function(drawingState) {
    // receives from main.js the view matrix
    var modelM = twgl.m4.identity();
    twgl.m4.setTranslation(modelM, this.position, modelM); // M = modelMatrix = worldMatrix, from object space to world space

    var normalM = twgl.m4.inverse(twgl.m4.transpose(modelM));

    var gl = drawingState.gl;

    // choose the shader(glsl) program we have compiled
    gl.useProgram(shaderProgram[1]);

    // we need to enable the attributes we had set up, which are set disabled by default by system
    gl.enableVertexAttribArray(shaderProgram[1].PositionAttribute);
    gl.enableVertexAttribArray(shaderProgram[1].NormalAttribute);

    // set the uniforms
    gl.uniformMatrix4fv(shaderProgram[1].ModelLoc, false, modelM);
    gl.uniformMatrix4fv(shaderProgram[1].ViewLoc, false, drawingState.view);
    gl.uniformMatrix4fv(shaderProgram[1].ProjectionLoc, false, drawingState.projection);
    gl.uniformMatrix4fv(shaderProgram[1].NormalMatrixLoc, false, normalM);

    gl.uniform3fv(shaderProgram[1].ColorLoc, this.color);

    gl.uniform2fv(shaderProgram[1].DiffuseTypeLoc, diffuseType);
    gl.uniform3fv(shaderProgram[1].uSpecularTypeLoc, specularType);
    gl.uniform1f(shaderProgram[1].LightConeOutLoc, drawingState.lightConeOut);
    gl.uniform1f(shaderProgram[1].LightConeInLoc, drawingState.lightConeIn);
    gl.uniform1f(shaderProgram[1].LightDecayLoc, drawingState.lightDecay);
    gl.uniform1f(shaderProgram[1].LightTargetLoc, drawingState.lightTarget);
    gl.uniform3fv(shaderProgram[1].LightTypeLoc, lightType);

    gl.uniform3fv(shaderProgram[1].LightPositionLoc, drawingState.lightPosition);
    gl.uniform3fv(shaderProgram[1].LightDirectionLoc, drawingState.lightDirection);
    gl.uniform3fv(shaderProgram[1].LightColorLoc, drawingState.lightColor);
    gl.uniform3fv(shaderProgram[1].AmbientLightColorLoc, drawingState.ambientLightColor);

    gl.uniform3fv(shaderProgram[1].DiffuseColorLoc, drawingState.diffuseColor);
    gl.uniform1f(shaderProgram[1].SpecShineLoc, drawingState.specShine);
    gl.uniform1f(shaderProgram[1].DToonThLoc, drawingState.DToonTh);
    gl.uniform1f(shaderProgram[1].SToonThLoc, drawingState.SToonTh);

    gl.uniform3fv(shaderProgram[1].SpecularColorLoc, drawingState.specularColor);
    gl.uniform3fv(shaderProgram[1].Eye, drawingState.eye);

    // connect the attributes to the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(shaderProgram[1].PositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(shaderProgram[1].NormalAttribute, 3, gl.FLOAT, false, 0, 0);

    // Do the drawing
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexPos.length / 3); // the last parameter specifies how many vertices to draw

    // WebGL is a state machine, so do not forget to disable all attributes after every drawing
    gl.disableVertexAttribArray(shaderProgram[1].PositionAttribute);
    gl.disableVertexAttribArray(shaderProgram[1].NormalAttribute);
}