'use strict';

function bindKeysToGame(game) {
    document.body.onkeydown = function(e) {
        var event = window.event ? window.event : e;
        if (event.keyCode === 65) // 'A'
            game.tryToMoveDisc(1, 2);
        else if (event.keyCode === 81) // 'Q'
            game.tryToMoveDisc(1, 3);
        else if (event.keyCode === 68) // 'D'
            game.tryToMoveDisc(2, 1);
        else if (event.keyCode === 83) // 'S'
            game.tryToMoveDisc(2, 3);
        else if (event.keyCode === 84) // 'T'
            game.tryToMoveDisc(3, 1);
        else if (event.keyCode === 70) // 'F'
            game.tryToMoveDisc(3, 2);
        e.stopPropagation();
    };
}

function disableKeys(game) {
    document.body.onkeydown = undefined;
}
