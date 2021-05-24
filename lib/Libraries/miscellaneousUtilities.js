'use strict';
/**
 * put miscellaneous utility functions here.
 */

/**
 * return corresponding ordinal number
 * @param cardinalNumber: a positive integer
 * @return a string storing corresponding ordinal number
 */
function ordinalNumber(cardinalNumber) {
    cardinalNumber = cardinalNumber || 1;

    cardinalNumber = Math.round(Math.abs(cardinalNumber)); // now cardinalNumber must be a natural number
    var tensDigit = Math.round((cardinalNumber / 10) % 10);
    var units = Math.round(cardinalNumber % 10);
    if (tensDigit != 1) {
        if (units == 1)
            return cardinalNumber + 'st';
        else if (units == 2)
            return cardinalNumber + 'nd';
        else if (units == 3)
            return cardinalNumber + 'rd';
    }
    return cardinalNumber + 'th';
}

/**
 * turn an angle to a radian
 * @param angle: degrees in angle
 */
function toRadians(angle) {
    return angle / 180 * Math.PI;
}

/**
 * convert r, g, b which are ranged from 0 to 255 to numbers ranged from 0 to 1 for GLSL
 * @param r: red color
 * @param g: green color
 * @param b: blue color
 * @return: a Float32Array defining the corresponding color
 */
function normalizeRgb(r, g, b)
{
    return [r / 255.0, g / 255.0, b / 255.0];
}