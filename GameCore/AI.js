'use strict';

// get solution by recursion
Game.prototype.getSolution = function() {
    var solution = [];

    // read the current status
    var numberOfRods = this.getNumberOfRods();
    var numberOfDiscs = this.getNumberOfDiscs();
    var rods = new Array(numberOfRods);
    for (var i = 0; i < rods.length; i++) {
        rods[i] = [];
        for (var j = 0; j < this.rods[i].getNumberOfDiscs(); j++)
            rods[i].push(Number(this.rods[i].stackOfDiscs[j].name[4]));
    }

    /**
     * find the rod which owns the specified disc
     * @param discIndex: the index of wanted disc (index starts from 1)
     * @return: the index of rod which owns the disc (index starts from 1); if not found, return 0
     */
    function findDisc(discIndex) {
        for (var i = 0; i < rods.length; i++)
            for (var j = 0; j < rods[i].length; j++)
                if (rods[i][j] == discIndex)
                    return i + 1;
        return 0; // not found
    }

    /**
     * derive the solution of 3 towers of Hanoi problem by recursion from any state
     * @param n: the number of discs
     * @param destination: the index of the target rod in the game (index starts from 1. typically, destination is 3)
     */
    function hanoi(n, destination) {
        if (n < 1) {
            throw 'n should be greater than or equal to 1';
        } else if (n == 1) {
            var rodIndex = findDisc(numberOfDiscs); // find the smallest disc
            if (rodIndex != destination) {
                rods[destination - 1].push(rods[rodIndex - 1].pop());
                solution.push([rodIndex, destination]);
            }
        } else { // n > 1
            var rodIndex = findDisc(numberOfDiscs + 1 - n);
            if (rodIndex != destination) {

                // get an leisure rod
                var temporary;
                for (var i = 1; i <= numberOfRods; i++) {
                    if (rodIndex != i && destination != i) {
                        temporary = i;
                        break;
                    }
                }

                // move all n - 1 smaller discs to the temporary rod
                hanoi(n - 1, temporary);

                // move the n-th disc from rodIndex rod to destination rod
                rods[destination - 1].push(rods[rodIndex - 1].pop());
                solution.push([rodIndex, destination]);
            }
            // move all n - 1 smaller discs to destination rod, too
            hanoi(n - 1, destination);
        }
    }

    hanoi(this.getNumberOfDiscs(), 3);

    return solution;
};

// this is a function that runs at loading time (note the parenthesis at the end)
(function() {
    var displayStepIndex = 0;

    // begin moving the first disc without waiting
    var wait = 0; // milli-seconds

    var lastTime = undefined; // we also use lastTime to denote the beginning of a display

    var solution;

    Game.prototype.displaySolution = function (drawingState) {
        if (this.displayMode) {

            // on the first call of every display, just get the solution
            if (!lastTime) {
                lastTime = drawingState.realTime;
                solution = this.getSolution();
                return;
            }

            var delta = drawingState.realTime - lastTime;
            lastTime = drawingState.realTime;

            // wait until nothing is moving
            if (this.movingUpwards || this.movingVertically || this.movingDownwards)
                return;

            if (displayStepIndex < solution.length) {
                if (wait <= 0) {
                    var step = solution[displayStepIndex];
                    this.tryToMoveDisc(step[0], step[1]);
                    displayStepIndex++;
                    // wait half a second between every two moves
                    wait = 500; // milli-seconds
                } else {
                    wait = Math.max(wait - delta, 0);
                }
            } else {
                this.displayMode = false; // turn off the display mode

                // prepared for the next display
                displayStepIndex = 0;
                wait = 0;
                lastTime = undefined;
                solution = undefined;

                // restore user controls
                enableButtons();
                bindKeysToGame(this);
            }
        }
    };
})();
