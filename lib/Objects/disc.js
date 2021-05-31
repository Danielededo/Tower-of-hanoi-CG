'use strict';

// allow the constructor to be "leaked" out
var Disc = undefined;

// now, I make a function that adds an object to that list. There's a funky thing here where I have to not only define
// the function, but also run it - so it has to be put in parenthesis
(function() {

    // Read shader source
    var vertexSource = `#version 300 es

    in vec3 vPosition;
    in vec3 vNormal;
    uniform mat4 uModelView;
    uniform mat4 uProjection;
    uniform mat4 uNormal;
    uniform mat4 uMVPFromLight;
    out vec3 fNormal;
    out vec3 fPosition; // vertex position in camera coordinate
    out vec3 uPosition; // pass on the original coordinate from the vertex shader to the fragment shader
    // for procedure texture
    out vec4 vPositionFromLight;

    void main(void) {
        vPositionFromLight = uMVPFromLight * vec4(vPosition, 1.0); // compute position in light coordinate
        fNormal = (uNormal * vec4(vNormal, 1.0)).xyz; // normals in camera coordinate
        uPosition = vPosition; // vertex position in model coordinate
        fPosition = (uModelView * vec4(vPosition, 1.0)).xyz; // vertex position in camera coordinate
        gl_Position = uProjection * uModelView * vec4(vPosition, 1.0);
    }`;
    var fragmentSource = `#version 300 es
    
    /**
    * we use procedural texture to draw discs
    */
   #ifdef GL_ES
       precision highp float;
   #endif
   uniform vec3 uColor; // the object's color
   uniform vec3 uLightDirection;
   uniform vec3 uLightColor;
   uniform sampler2D uShadowMap; // depth value in light coordinate
   in vec3 fNormal;
   in vec3 fPosition;
   in vec3 uPosition;
   in vec4 vPositionFromLight;
   out vec4 myOutputColor;
   /**
    * a pulse function in order to make stripe
    */
   float pulse(float value, float destination) {
       return floor(mod(value * destination, 1.0) + 0.5);
   }

   /**
   * compute the Blinn-Phong shading model
   * @param lightDirection: the direction of the light in camera coordinate
   * @param lightIntensity: the intensity of the light
   * @param ambientCoefficient: the coefficient of ambient light
   * @param diffuseCoefficient: the coefficient of diffuse light
   * @param specularCoefficient: the coefficient of specular light
   * @param specularExponent: the lightiness of specular light
   * @return a 2D vector whose first element is the combination final coefficient of ambient light and diffuse
   * light while the second element is the final coefficient of specular light
   */
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

   /**
    * compute z-value from a vec4
    */
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
       vec2 light = blinnPhongShading(uLightDirection, 1.0, 0.5, 1.0, 1.5, 30.0);
       vec3 objectColor = (1.0 + 0.3 * pulse(uPosition.z, 0.1)) * uColor; // add some stripes
       vec3 ambientAndDiffuseColor = light.x * objectColor;
       vec3 specularColor = light.y * uLightColor;
       myOutputColor = vec4(visibility * (ambientAndDiffuseColor + specularColor), 1.0);
   }`;

    // compile the shaders only when initializing every object
    // we do not have to recompile them during drawing in every frame

    var shaderProgram = undefined;

    // As to rod, since every rod is identical, we could put vertexPos, normal and such things outside function init
    // so that we only create buffers once for every rod to save time.
    // As to discs, their size are different so data in buffers varies. We have to use this.vertexPos, this.normal and
    // so on inside function init.
    // As to the ground, we have one and only one ground, so either way is fine.

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

            // this gives us access to uniforms
            shaderProgram.ModelViewLoc = gl.getUniformLocation(shaderProgram, 'uModelView');
            shaderProgram.ProjectionLoc = gl.getUniformLocation(shaderProgram, 'uProjection');
            shaderProgram.NormalMatrixLoc = gl.getUniformLocation(shaderProgram, 'uNormal');
            shaderProgram.MVPFromLightLoc = gl.getUniformLocation(shaderProgram, 'uMVPFromLight');
            shaderProgram.ColorLoc = gl.getUniformLocation(shaderProgram, 'uColor');
            shaderProgram.LightDirectionLoc = gl.getUniformLocation(shaderProgram, 'uLightDirection');
            shaderProgram.LightColorLoc = gl.getUniformLocation(shaderProgram, 'uLightColor');
            shaderProgram.ShadowMapLoc = gl.getUniformLocation(shaderProgram, 'uShadowMap');
        }

        // data ...
        // vertex positions
        this.vertexPos = this.generateLocalPosition();
        // normals
        this.normal = this.generateNormal();

        // now to make the buffers
        this.posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexPos), gl.STATIC_DRAW);
        this.normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normal), gl.STATIC_DRAW);
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
     * compute shadow map
     */
    Disc.prototype.drawBefore = function(drawingState) {
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
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.vertexAttribPointer(shadowProgram.PositionAttribute, 3, gl.FLOAT, false, 0, 0);

        // Do the drawing
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPos.length / 3);

        // WebGL is a state machine, so do not forget to disable all attributes after every drawing
        gl.disableVertexAttribArray(shadowProgram.PositionAttribute);
    }

    /**
     * draw on the screen
     */
    Disc.prototype.draw = function(drawingState) {
        // we make a model matrix to place the disc in the world
        var modelM = twgl.m4.identity();
        twgl.m4.setTranslation(modelM, this.position, modelM);
        var modelViewM = twgl.m4.multiply(modelM, drawingState.view);
        var normalM = twgl.m4.inverse(twgl.m4.transpose(modelViewM));
        var MVP = twgl.m4.multiply(twgl.m4.multiply(modelM, drawingState.lightView), drawingState.lightProjection);

        var gl = drawingState.gl;

        // choose the shader program we have compiled
        gl.useProgram(shaderProgram);

        // we need to enable the attributes we had set up, which are set disabled by default by system
        gl.enableVertexAttribArray(shaderProgram.PositionAttribute);
        gl.enableVertexAttribArray(shaderProgram.NormalAttribute);

        // set the uniforms
        gl.uniformMatrix4fv(shaderProgram.ModelViewLoc, false, modelViewM);
        gl.uniformMatrix4fv(shaderProgram.ProjectionLoc, false, drawingState.projection);
        gl.uniformMatrix4fv(shaderProgram.NormalMatrixLoc, false, normalM);
        gl.uniformMatrix4fv(shaderProgram.MVPFromLightLoc, false, MVP);
        gl.uniform3fv(shaderProgram.ColorLoc, this.color);
        gl.uniform3fv(shaderProgram.LightDirectionLoc, drawingState.lightDirection);
        gl.uniform3fv(shaderProgram.LightColorLoc, drawingState.lightColor);
        gl.uniform1i(shaderProgram.ShadowMapLoc, 0); // we will store the shadow map in TMU0 soon, so instruct shader
        // programs to use use TMU0

        // connect the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
        gl.vertexAttribPointer(shaderProgram.PositionAttribute, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(shaderProgram.NormalAttribute, 3, gl.FLOAT, false, 0, 0);

        // Bind texture
        gl.activeTexture(gl.TEXTURE0); // bind our shadow map to TMU0
        gl.bindTexture(gl.TEXTURE_2D, drawingState.shadowMap);

        // Do the drawing
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexPos.length / 3);

        // WebGL is a state machine, so do not forget to disable all attributes after every drawing
        gl.disableVertexAttribArray(shaderProgram.PositionAttribute);
        gl.disableVertexAttribArray(shaderProgram.NormalAttribute);
    }
    
    /**
      * return the center position in model coordinate for examination
      */
    Disc.prototype.center = function(drawingState) {
        return twgl.v3.add(this.position, [0, this.height / 2, 0]);
    }

})();