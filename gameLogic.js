'use strict';

// the core logic of the game

// the constructor creates the data structures (for discs and rods)
function Game() {

    this.rods = []; //array that contains the rod objects
    var rodDistance = 1.6; // the distance between the center of two near rods
    var rodDiameter = 0.2; // the diameter of the rod
    var rodHeight = 0.6;  // the height of the rod
    var rodPrecision = 30.0; // the number of triangles in the top face to simulate a circle
    var rodColor = [50/255, 50/255, 50/255];
    this.rods[0] = new Rod('rod1', [-rodDistance, 0, 0], rodDiameter, rodHeight, rodPrecision, rodColor);
    this.rods[1] = new Rod('rod2', [0, 0, 0], rodDiameter, rodHeight, rodPrecision, rodColor);
    this.rods[2] = new Rod('rod3', [rodDistance, 0, 0], rodDiameter, rodHeight, rodPrecision, rodColor);

    // put all discs to the first rod through the array stackOfDiscs of rod[0]
    this.heightOfDisc = 0.1;
    var discPrecision = 150;
    // the inner diameter of a disc is the diameter of a rod
    this.rods[0].stackOfDiscs.push(new Disc('disc1', [-rodDistance, 0 * this.heightOfDisc, 0], 1.2, rodDiameter,
                            this.heightOfDisc, discPrecision, [200/255, 200/255, 0])); // vertex color is yellow
    this.rods[0].stackOfDiscs.push(new Disc('disc2', [-rodDistance, 1 * this.heightOfDisc, 0], 1.0, rodDiameter,
                            this.heightOfDisc, discPrecision, [0, 0, 200/255])); // vertex color is blue
    this.rods[0].stackOfDiscs.push(new Disc('disc3', [-rodDistance, 2 * this.heightOfDisc, 0], 0.8, rodDiameter,
                            this.heightOfDisc, discPrecision, [0, 200/255, 0])); // vertex color is lime
    this.rods[0].stackOfDiscs.push(new Disc('disc4', [-rodDistance, 3 * this.heightOfDisc, 0], 0.6, rodDiameter,
                            this.heightOfDisc, discPrecision, [200/255, 0, 0])); // vertex color is red
    
    // initialize the game state
    this.movingUpwards = false; // whether there is a disc moving upwards
    this.movingSideways = false; // whether there is a disc moving laterally
    this.movingDownwards = false; // whether there is a disc moving downwards
    
    this.movingDisc = undefined; // for moving animations
    this.fromRod = undefined;
    this.toRod = undefined;

    this.lastTime = undefined;

    this.hasSucceeded = false; // avoid infinite congratulations
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

Game.prototype.tryToMoveDisc = function(from, to) {

    from = from || 1;
    to = to || 1;

    // if a disc is already moving
    if (this.movingUpwards || this.movingSideways || this.movingDownwards) {
        alert('You can move only one disc at a time!');
        return;
    }
    // if the starting rod is empty
    if (this.rods[from - 1].getNumberOfDiscs() === 0) {
        alert('There is no disc on the ' + ordinalNumber(from) + ' rod!');
        return;
    }
    // if the starting disc is bigger than the destination disc
    if (this.rods[to - 1].getNumberOfDiscs() !== 0 && //the destination rod is not empty
        this.rods[to - 1].stackOfDiscs[this.rods[to - 1].getNumberOfDiscs() - 1].outerDiameter <
        this.rods[from - 1].stackOfDiscs[this.rods[from - 1].getNumberOfDiscs() - 1].outerDiameter) {
        alert('You cannot move this disc, because it is bigger than the destination disc (the disc on the top of the '
            + ordinalNumber(to) + ' rod)!');
        return;
    }

    
    // we assume after the first success, player will continue to move discs for fun
    if (from == 3) {
        this.hasSucceeded = false;
    }

    this.movingUpwards = true; // prepared for moving upwards
    this.movingSideways = false;
    this.movingDownwards = false;

    // the disc which is moving
    this.movingDisc = this.rods[from - 1].stackOfDiscs.pop();
    this.fromRod = this.rods[from - 1];
    this.toRod = this.rods[to - 1];
}

Game.prototype.updateDiscPosition = function(drawingState) {

    var movingSpeed = 0.002;
    var flyingAltitude = 0.8;

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
        var posOfRod = twgl.v3.create(this.toRod.position[0], flyingAltitude, this.toRod.position[2]);
        var forward = delta * movingSpeed;
        if (twgl.v3.distance(posOfDisc, posOfRod) > forward) {
            var discToRod = twgl.v3.subtract(posOfRod, posOfDisc);
            var movingVector = twgl.v3.mulScalar(twgl.v3.normalize(discToRod), forward);
            this.movingDisc.position = twgl.v3.add(posOfDisc, movingVector);
        } else { // we have reached the destination rod
            this.movingDisc.position = posOfRod;
            this.movingUpwards = false;
            this.movingSideways = false;
            this.movingDownwards = true; // start to moving downwards
        }
   } else if (this.movingDownwards) {
        var number = this.toRod.getNumberOfDiscs(); // number of already existed discs on the target rod
        var targetAltitude = number * this.heightOfDisc; // the target height of the center of the bottom face of the
        // moving disc
        var down = delta * movingSpeed;
        if (this.movingDisc.position[1] - down > targetAltitude) {
             this.movingDisc.position = [this.toRod.position[0], this.movingDisc.position[1] - down, this.toRod.position[2]];
        } else { // we have reached the top disc (if one)
            this.movingDisc.position = [this.toRod.position[0], targetAltitude, this.toRod.position[2]];
            this.toRod.stackOfDiscs.push(this.movingDisc);
            this.movingUpwards = false; // stop moving
            this.movingSideways = false;
            this.movingDownwards = false;
        }
   }
}

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