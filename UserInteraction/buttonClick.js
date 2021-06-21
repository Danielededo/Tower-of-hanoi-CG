// this is the only .js file using jQuery

'use strict';

function bindButtonsToGame(game) {

    $('#button-from1to2')[0].onclick = function () { // bind on-click events
        game.tryToMoveDisc(1, 2);
    }
    $('#button-from1to3')[0].onclick = function () {
        game.tryToMoveDisc(1, 3);
    }
    $('#button-from2to1')[0].onclick = function () {
        game.tryToMoveDisc(2, 1);
    }
    $('#button-from2to3')[0].onclick = function () {
        game.tryToMoveDisc(2, 3);
    }
    $('#button-from3to1')[0].onclick = function () {
        game.tryToMoveDisc(3, 1);
    }
    $('#button-from3to2')[0].onclick = function () {
        game.tryToMoveDisc(3, 2);
    }
}

function disableButtons() {

    $('#button-from1to2')[0].disabled = true;
    $('#button-from1to3')[0].disabled = true;
    $('#button-from2to1')[0].disabled = true;
    $('#button-from2to3')[0].disabled = true;
    $('#button-from3to1')[0].disabled = true;
    $('#button-from3to2')[0].disabled = true;
}

function enableButtons() {

    $('#button-from1to2')[0].disabled = false;
    $('#button-from1to3')[0].disabled = false;
    $('#button-from2to1')[0].disabled = false;
    $('#button-from2to3')[0].disabled = false;
    $('#button-from3to1')[0].disabled = false;
    $('#button-from3to2')[0].disabled = false;
}