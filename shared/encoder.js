const encodeUpdate = (players) => {
    arr = new new Uint16Array();
    arr[0] = players.length
    for (let i = 1; i < players.length * 3; i = i + 3) {
        const player = players[i]
        arr[i] = player.id
        arr[i + 1] = player.x
        arr[i + 3] = player.y
    }
    return arr
}
const decodeUpdate = (encodedArr) => {
    players = []
    for (let i = 1; i < encodedArr[0]; i += 3) {
        let player = {}
        player.id = encodedArr[i]
        player.x = encodedArr[i+1]
        player.y = encodedArr[i+2]
        players.push(player)
    }
    return players
    

}

const encodeInput = (mouseX, mouseY, key) => {
    arr = new new Uint16Array();
    arr[0] = mouseX
    arr[1] = mouseY
    arr[2] = key

}

const decodeInput = (arr) => {
    return {mouseX: arr[0], mouseY: arr[1], key: arr[2]}
}