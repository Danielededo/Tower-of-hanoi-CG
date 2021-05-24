"use strict";

/**
 * This class is a wrapper between the .obj file of a 3D object,
 * and the methods of the OBJ library.
 */
class ObjectWrapper {
    constructor(pathName) {
        this.pathName = pathName;
        this.object = null;
        this.model = null;
        this.localMatrix = null;
        this.programInfo = null;
    }

    /**
     * Loads the object asyncronously so it doesn't block the main thread
     * and it creates a mesh from it.
     */
    async loadModel() {
        this.object = await utils.get_objstr(this.pathName);
        this.model = new OBJ.Mesh(this.object);
    }

    /**
     * Returns an array containing the indices to be used in conjunction
     * with the below arrays in order to draw the triangles that make
     * up faces.
     */
    getIndices() {
        return this.model.indices;
    }

    /**
     * Returns an array containing the (u,v) coordinates of the mesh's
     * texture.
     */
    getTextures() {
        return this.model.textures;
    }

    /**
     * Returns an array containing the vertex values that correspond
     * to each unique face index. Each vertex's component is an element
     * of the array.
     */
    getVertices() {
        return this.model.vertices;
    }

    /**
     * Returns an array containing the vertex normals that correspond 
     * to each unique face index, like the one in getVertices().
     */
    getNormals() {
        return this.model.vertexNormals;
    }

    /**
     * Setter of the local matrix
     */
    setLocalMatrix(m) {
        this.localMatrix = m;
        return this;
    }

    /**
     * Getter of the local matrix
     */
    getLocalMatrix() {
        return this.localMatrix;
    }

    /**
     * Setter of the programInfo
     */
    setProgramInfo(p) {
        this.programInfo = p;
        return this;
    }

    /**
     * Getter of the programInfo
     */
    getProgramInfo(p) {
        return this.programInfo;
    }
}