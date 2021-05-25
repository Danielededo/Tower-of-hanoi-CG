'use strict';
/**
 the core logic of the game.
 */

// the constructor
function Game() {

    this.rods = [];
    var rodDistance = 160; // the distance between two nearest rods
    var rodDiameter = 20;
    var rodHeight = 60;
    var rodPrecision = 30;
    this.rods[0] = new Rod('rod1', [-rodDistance, 0, 0], rodDiameter, rodHeight, rodPrecision);
    this.rods[1] = new Rod('rod2', [0, 0, 0], rodDiameter, rodHeight, rodPrecision);
    this.rods[2] = new Rod('rod3', [rodDistance, 0, 0], rodDiameter, rodHeight, rodPrecision);

    // put all discs to the first rod
    this.heightOfDisc = 10;
    var discPrecision = 75;
    // the inner diameter of a disc is the diameter of a rod
    this.rods[0].stackOfDiscs.push(new Disc('disc1', [-rodDistance, 0 * this.heightOfDisc, 0], 120, rodDiameter,
                            this.heightOfDisc, discPrecision, normalizeRgb(255, 255, 0))); // vertex color is yellow
    this.rods[0].stackOfDiscs.push(new Disc('disc2', [-rodDistance, 1 * this.heightOfDisc, 0], 100, rodDiameter,
                            this.heightOfDisc, discPrecision, normalizeRgb(0, 0, 255))); // vertex color is blue
    this.rods[0].stackOfDiscs.push(new Disc('disc3', [-rodDistance, 2 * this.heightOfDisc, 0], 80, rodDiameter,
                            this.heightOfDisc, discPrecision, normalizeRgb(0, 255, 0))); // vertex color is lime
    this.rods[0].stackOfDiscs.push(new Disc('disc4', [-rodDistance, 3 * this.heightOfDisc, 0], 60, rodDiameter,
                            this.heightOfDisc, discPrecision, normalizeRgb(255, 0, 0))); // vertex color is red
    
    // initialize the game state
    this.movingUpwards = false; // whether there is a disc is moving upwards
    this.movingSideways = false; // whether there is a disc is moving laterally
    this.movingDownwards = false; // whether there is a disc is moving downwards
    
    this.movingDisc = undefined; // for moving animations
    this.fromRod = undefined;
    this.toRod = undefined;

    this.lastTime = undefined;

    //this.playerSteps = []; // record player's every step. It is not used in the game at all.
    
    this.hasSucceeded = false; // avoid infinite congratulations

    //this.displayMode = false;
}

Game.prototype.getNumberOfRods = function() {
    return this.rods.length;
}

Game.prototype.getNumberOfDiscs = function() {
    var count = 0;
    for (var i = 0; i < this.getNumberOfRods(); i++)
        count += this.rods[i].getNumberOfDiscs();
    return count;
}

/**
 * try to move a disk
 * @param from: the index of the starting rod (index starts from 1)
 * @param to: the index of the ending rod (index starts from 1)
 * @param drawingState: a Javascript Object defined in allObjects.js. We use it to update the number of milliseconds since
 *                      the program started running
 */
Game.prototype.tryToMoveDisc = function(from, to) {
    from = from || 1;
    to = to || 1;

    // if a disk is already moving
    if (this.movingUpwards || this.movingSideways || this.movingDownwards) {
        alert('You can move only one disk at a time!');
        return;
    }
    // if the origin rod is empty
    if (this.rods[from - 1].getNumberOfDiscs() === 0) {
        alert('There is no disk on the ' + ordinalNumber(from) + ' rod!');
        return;
    }
    // if the origin disk is bigger than the destination disk
    if (this.rods[to - 1].getNumberOfDiscs() !== 0 && //the destination rod is not empty
        this.rods[to - 1].stackOfDiscs[this.rods[to - 1].getNumberOfDiscs() - 1].outerDiameter <
        this.rods[from - 1].stackOfDiscs[this.rods[from - 1].getNumberOfDiscs() - 1].outerDiameter) {
        alert('You cannot move this disk, because it is bigger than the destination disk (the disk on the top of the '
            + ordinalNumber(to) + ' rod)!');
        return;
    }

    
    // I assume after the first success, player will continue to move discs for fun
    if (from == 3) {
    //if (from == 3 && !this.displayMode) {
        this.hasSucceeded = false;
    }

    this.movingUpwards = true; // prepared for moving upwards
    this.movingSideways = false;
    this.movingDownwards = false;

    // the disk which is moving
    this.movingDisc = this.rods[from - 1].stackOfDiscs.pop();
    this.fromRod = this.rods[from - 1];
    this.toRod = this.rods[to - 1];

    //this.playerSteps.push([from, to]);
}

/**
 * update disc's position
 * if there is a moving disc, compute and change the position of it in world coordinate. Otherwise, nothing's position
 * will be changed
 * please call it in function draw in main.js
 */
Game.prototype.updateDiscPosition = function(drawingState) {
    var movingSpeed = 0.3;  // moving units in world coordinate per millisecond
    var flyingAltitude = 80; // the flying altitude of the moving disc in world coordinate

    // on the first call, do nothing
    if (!this.lastTime) {
        this.lastTime = drawingState.realTime;
        return;
    }
    var delta = drawingState.realTime - this.lastTime;
    this.lastTime = drawingState.realTime;

    if (this.movingUpwards) {
        var up = delta * movingSpeed;
        if (this.movingDisc.position[1] + up < flyingAltitude) {
            this.movingDisc.position[1] = Math.min(this.movingDisc.position[1] + up, flyingAltitude)
        } else { // we have reached altitude
            this.movingDisc.position[1] = flyingAltitude;
            this.movingUpwards = false; // start moving laterally
            this.movingSideways = true;
            this.movingDownwards = false;
        }
   } else if (this.movingSideways) {
        // the position of the moving disc after the updating in the last frame
        var posOfDisc = this.movingDisc.position;
        // the coordinate of the sky above the target rod
        var posOfRod = v3.create(this.toRod.position[0], flyingAltitude, this.toRod.position[2]);
        var forward = delta * movingSpeed;
        if (v3.distance(posOfDisc, posOfRod) > forward) {
            var discToRod = v3.subtract(posOfRod, posOfDisc);
            var movingVector = v3.mulScalar(v3.normalize(discToRod), forward);
            this.movingDisc.position = v3.add(posOfDisc, movingVector);
        } else { // we have reached the destination rod
            this.movingDisc.position = posOfRod;
            this.movingUpwards = false;
            this.movingSideways = false;
            this.movingDownwards = true; // start to moving downwards
        }
   } else if (this.movingDownwards) {
        var number = this.toRod.getNumberOfDiscs(); // number of already existed discs on the target rod
        var targetAltitude = number * this.heightOfDisc; // the target height of the center of the bottom face of the
        // moving disc in world coordinate
        var down = delta * movingSpeed;
        if (this.movingDisc.position[1] - down > targetAltitude) {
             this.movingDisc.position = [this.toRod.position[0], this.movingDisc.position[1] - down, this.toRod.position[2]];
        } else { // we have reached the top disk (if one)
            this.movingDisc.position = [this.toRod.position[0], targetAltitude, this.toRod.position[2]];
            this.toRod.stackOfDiscs.push(this.movingDisc);
            this.movingUpwards = false; // stop moving
            this.movingSideways = false;
            this.movingDownwards = false;
        }
   }
   // else: nothing is moving
}
    
/**
 * check whether the game is over and the player succeed
 * please call this method when and only when a moving animation is ended.
 */
Game.prototype.checkResult = function() {
    var lastRod = this.rods[this.getNumberOfRods() - 1]; // the last rod is the target rod of the game
    var secondRod = this.rods[this.getNumberOfRods() - 2]; // the second rod is the target rod of the game
    if (!this.hasSucceeded
     && !this.movingUpwards && !this.movingSideways && !this.movingDownwards // nothing is moving
     && (lastRod.getNumberOfDiscs() === this.getNumberOfDiscs() || secondRod.getNumberOfDiscs() === this.getNumberOfDiscs())) {
        alert('Congratulations, you won the game!');
        this.hasSucceeded = true;
    }
}