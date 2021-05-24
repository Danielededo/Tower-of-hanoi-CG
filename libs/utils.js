"use strict";

const m4 = twgl.m4;

function makeLocalMatrix(tx, ty, tz, rx, ry, rz, s) {
    let translationMatrix = m4.translation([tx, ty, tz]);
    let rotationX = m4.rotationX(rx);
    let rotationY = m4.rotationX(ry);
    let rotationZ = m4.rotationX(rz);
    let scaling = m4.scaling([s, s, s]);

    let out = m4.multiply(rotationZ, scaling);
    m4.multiply(out, rotationY, out);
    m4.multiply(out, rotationX, out);
    m4.multiply(out, translationMatrix, out);

    return out;
}

function degToRad(angle) {
    return (angle * Math.PI / 180.0);
}