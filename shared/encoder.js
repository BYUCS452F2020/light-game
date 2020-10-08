"use strict";
exports.__esModule = true;
exports.decodeInput = exports.encodeInput = exports.decodeUpdate = exports.encodeUpdate = void 0;
exports.encodeUpdate = function (players) {
    var playersLength = players.size;
    var arr = new Uint16Array(1 + playersLength * 5);
    arr[0] = playersLength;
    var i = 1;
    players.forEach(function (value, key) {
        arr[i] = value.id;
        arr[i + 1] = value.position.x;
        arr[i + 2] = value.position.y;
        arr[i + 3] = value.visionDirection * 180 / Math.PI + 180;
        arr[i + 4] = value.visionAngle * 180 / Math.PI + 180;
        i = i + 5;
    });
    return arr;
};
exports.decodeUpdate = function (encodedArr) {
    var players = [];
    var numPlayers = encodedArr[0];
    var playerNumber = 0;
    for (var i = 1; playerNumber < numPlayers; i += 5, playerNumber += 1) {
        var player = {};
        player['id'] = encodedArr[i];
        player['x'] = encodedArr[i + 1];
        player['y'] = encodedArr[i + 2];
        player['d'] = (encodedArr[i + 3] - 180) * Math.PI / 180;
        player['a'] = (encodedArr[i + 4] - 180) * Math.PI / 180;
        players.push(player);
    }
    return players;
};
exports.encodeInput = function (mouseX, mouseY, keyUP, keyDOWN, keyLEFT, keyRIGHT, keyExpandLight, keyRestrictLight) {
    var arr = new Uint16Array(8);
    arr[0] = mouseX;
    arr[1] = mouseY;
    arr[2] = keyUP ? 1 : 0;
    arr[3] = keyDOWN ? 1 : 0;
    arr[4] = keyLEFT ? 1 : 0;
    arr[5] = keyRIGHT ? 1 : 0;
    arr[6] = keyExpandLight ? 1 : 0;
    arr[7] = keyRestrictLight ? 1 : 0;
    return arr;
};
exports.decodeInput = function (arr) {
    return { mouseX: arr[0], mouseY: arr[1], keyUP: arr[2], keyDOWN: arr[3], keyLEFT: arr[4], keyRIGHT: arr[5], keyExpandLight: arr[6], keyRestrictLight: arr[7] };
};
