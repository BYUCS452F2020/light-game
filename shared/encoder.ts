import { Player } from '../server/domain';

export const encodeUpdate = (players: Map<string, Player>) => {
    const playersLength = players.size
    let arr = new Uint16Array(1 + playersLength * 4);
    arr[0] = playersLength
    let i = 1;
    players.forEach((value: Player, key: string) => {
        arr[i] = value.id;
        arr[i + 1] = value.position.x; //Conversion to uint16 looses float precision
        arr[i + 2] = value.position.y;
        arr[i + 3] = value.visionDirection * 180/Math.PI + 180; // Convert to degrees first so as to not lose precision with radians (also add 180 degrees since this is a uint)
        i = i + 4;
      });
    return arr
}

export const decodeUpdate = (encodedArr: Uint16Array) => {
    let players = [] // Partial player information
    const numPlayers = encodedArr[0]
    let playerNumber = 0;
    for (let i = 1; playerNumber < numPlayers; i += 4, playerNumber += 1) {
        let player = {}
        player['id'] = encodedArr[i]
        player['x'] = encodedArr[i+1]
        player['y'] = encodedArr[i+2]
        player['v'] = (encodedArr[i+3] - 180) * Math.PI/180; // Convert back to radians (subtracting 180 degrees from avoiding overflow from before)
        players.push(player)
    }
    return players
}

export const encodeInput = (mouseX, mouseY, keyUP: boolean, keyDOWN: boolean, keyLEFT: boolean, keyRIGHT: boolean) => {
    let arr = new Uint16Array(6);
    arr[0] = mouseX
    arr[1] = mouseY
    arr[2] = keyUP ? 1 : 0
    arr[3] = keyDOWN ? 1 : 0
    arr[4] = keyLEFT ? 1 : 0
    arr[5] = keyRIGHT ? 1 : 0
    return arr;
}

export const decodeInput = (arr: Uint16Array) => {
    return {mouseX: arr[0], mouseY: arr[1], keyUP: arr[2], keyDOWN: arr[3], keyLEFT: arr[4], keyRIGHT: arr[5]}
}