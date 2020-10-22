import { Player } from '../server/domain';
import { PlayerClient } from '../client/src/models'

// NOTE: This file acts as the bridge between server and client models
// Increase this number every time a new peice of information is added
const numInformationEncoded = 7;

export const encodeUpdate = (players: Map<string, Player>) => {
    const playersLength = players.size
    let arr = new Uint16Array(1 + playersLength * numInformationEncoded);
    arr[0] = playersLength
    let i = 1;
    players.forEach((value: Player, key: string) => {
        arr[i] = value.id;
        arr[i + 1] = value.position.x; //Conversion to uint16 looses float precision
        arr[i + 2] = value.position.y;
        arr[i + 3] = value.visionDirection * 180/Math.PI + 180; // Convert to degrees first so as to not lose precision with radians (also add 180 degrees since this is a uint)
        arr[i + 4] = value.visionAngle * 180/Math.PI + 180;
        arr[i + 5] = value.hp;
        arr[i + 6] = value.isInLight ? 1 : 0;
        i = i + numInformationEncoded;
      });
    return arr
}

export const decodeUpdate = (encodedArr: Uint16Array): PlayerClient[] => {
    let players: PlayerClient[] = [] // Partial player information
    const numPlayers = encodedArr[0]
    let playerNumber = 0;
    for (let i = 1; playerNumber < numPlayers; i += numInformationEncoded, playerNumber += 1) {
        players.push(new PlayerClient(
            encodedArr[i],
            encodedArr[i+1],
            encodedArr[i+2],
            (encodedArr[i+3] - 180) * Math.PI/180, // Convert back to radians (subtracting 180 degrees from avoiding overflow from before)
            (encodedArr[i+4] - 180) * Math.PI/180,
            encodedArr[i+5],
            encodedArr[i+6] == 1
        ))
    }
    return players
}

export const encodeInput = (mouseX, mouseY, keyUP: boolean, keyDOWN: boolean, keyLEFT: boolean, keyRIGHT: boolean, keyExpandLight: boolean, keyRestrictLight: boolean) => {
    let arr = new Uint16Array(8);
    arr[0] = mouseX
    arr[1] = mouseY
    arr[2] = keyUP ? 1 : 0
    arr[3] = keyDOWN ? 1 : 0
    arr[4] = keyLEFT ? 1 : 0
    arr[5] = keyRIGHT ? 1 : 0
    arr[6] = keyExpandLight ? 1 : 0
    arr[7] = keyRestrictLight ? 1 : 0
    return arr;
}

export const decodeInput = (arr: Uint16Array) => {
    return {mouseX: arr[0], mouseY: arr[1], keyUP: arr[2], keyDOWN: arr[3], keyLEFT: arr[4], keyRIGHT: arr[5], keyExpandLight: arr[6], keyRestrictLight: arr[7]}
}