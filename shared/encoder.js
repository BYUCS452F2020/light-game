"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeInput = exports.encodeInput = exports.decodeUpdate = exports.encodeUpdate = void 0;
const numInformationEncoded = 7;
exports.encodeUpdate = (players) => {
    const playersLength = players.size;
    let arr = new Uint16Array(1 + playersLength * numInformationEncoded);
    arr[0] = playersLength;
    let i = 1;
    players.forEach((value, key) => {
        arr[i] = value.id;
        arr[i + 1] = value.position.x;
        arr[i + 2] = value.position.y;
        arr[i + 3] = value.visionDirection * 180 / Math.PI + 180;
        arr[i + 4] = value.visionAngle * 180 / Math.PI + 180;
        arr[i + 5] = value.hp;
        arr[i + 6] = value.isInLight ? 1 : 0;
        i = i + numInformationEncoded;
    });
    return arr;
};
exports.decodeUpdate = (encodedArr) => {
    let players = [];
    const numPlayers = encodedArr[0];
    console.log(encodedArr);
    let playerNumber = 0;
    for (let i = 1; playerNumber < numPlayers; i += numInformationEncoded, playerNumber += 1) {
        let player = {};
        player['id'] = encodedArr[i];
        player['x'] = encodedArr[i + 1];
        player['y'] = encodedArr[i + 2];
        player['visionDirection'] = (encodedArr[i + 3] - 180) * Math.PI / 180;
        player['visionAngle'] = (encodedArr[i + 4] - 180) * Math.PI / 180;
        player['hp'] = encodedArr[i + 5];
        player['isInLight'] = encodedArr[i + 6] == 1;
        players.push(player);
    }
    return players;
};
exports.encodeInput = (mouseX, mouseY, keyUP, keyDOWN, keyLEFT, keyRIGHT, keyExpandLight, keyRestrictLight) => {
    let arr = new Uint16Array(8);
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
exports.decodeInput = (arr) => {
    return { mouseX: arr[0], mouseY: arr[1], keyUP: arr[2], keyDOWN: arr[3], keyLEFT: arr[4], keyRIGHT: arr[5], keyExpandLight: arr[6], keyRestrictLight: arr[7] };
};
