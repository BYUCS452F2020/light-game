import * as Phaser from 'phaser'
import ioclient from 'socket.io-client';
import { Constants } from '../../shared/constants';

export class RoomScene extends Phaser.Scene {

    socketClient: SocketIOClient.Socket
    title: Phaser.GameObjects.Text;
    roomIdTitle: Phaser.GameObjects.Text;
    startRoomButton: Phaser.GameObjects.Text;
    backButton: Phaser.GameObjects.Text;
    textOfUsernames: Phaser.GameObjects.Text[] = [];

    // Get this from title scene AND pass to other scene for game
    playerUsername: string = null;

    // Get this from title scene
    roomId: string = null;

    // Gets from server ping on a periodic basis
    roomUsernames: string[] = [];

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super('room');
    }

    init(data) {
        console.log('init ROOM', data);
        this.playerUsername = data.playerUsername;
        this.roomId = data.roomId;
        this.socketClient = data.socketClient;

        if (!this.socketClient.hasListeners(Constants.ROOM_WAITING_PLAYERS_RESPONSE)) {
            this.socketClient.on(Constants.ROOM_WAITING_PLAYERS_RESPONSE, (usernames: string[]) => {
                // TODO: Better error handling
                console.log(usernames);
                this.roomUsernames = usernames;
            })
        }
    }

    preload() {

    }

    create() {
        console.log(`CREATING WAITING ROOM ${this.roomId}`)
        const titleX = (window.outerWidth / 2) - 350;
        const titleY = (window.outerHeight / 2) - 200;
        this.title = this.add.text(titleX, titleY, 'Waiting Room', { fill: '#0f0', fontSize: '30px' })

        const roomX = (window.outerWidth / 2) + 150;
        const roomY = (window.outerHeight / 2) - 200;
        this.roomIdTitle = this.add.text(roomX, roomY, 'Room ID: ' + this.roomId, { fill: '#0f0', fontSize: '30px' })

        const backButtonX = (window.outerWidth / 2) - 350;
        const backButtonY = (window.outerHeight / 2) + 200;
        const startButtonX = backButtonX + 500;
        const startButtonY = backButtonY;

        this.startRoomButton = this.add.text(startButtonX, startButtonY, 'Start Room', { fill: '#0f0' })
        .setInteractive()
        .on('pointerdown', () => this.startGame() )
        .on('pointerover', () => this.startRoomButton.setStyle({ fill: '#ff0'}))
        .on('pointerout', () => this.startRoomButton.setStyle({ fill: '#0f0'}));

        this.backButton = this.add.text(backButtonX, backButtonY, 'Back to Title Screen', { fill: '#0f0' })
        .setInteractive()
        .on('pointerdown', () => this.backButtonAction() )
        .on('pointerover', () => this.backButton.setStyle({ fill: '#ff0'}))
        .on('pointerout', () => this.backButton.setStyle({ fill: '#0f0'}));

        this.scale.on('resize', (gameSize, baseSize, displaySize, resolution, previousWidth, previousHeight) => {
            // console.log(`${displaySize['width']},${displaySize['height']}`)
            // // game size stays the same (it is set on load, defined by the config object of the game)
            // this.title.x = (displaySize['width'] / 2) - 150;
            // this.title.y = (displaySize['height'] / 2) - 200;

            // this.startRoomButton.x = (displaySize['width'] / 2) - 50;
            // this.startRoomButton.y = (displaySize['height'] / 2) + 50;

            // this.joinRoomButton.x = (displaySize['width'] / 2) - 45;
            // this.joinRoomButton.y = (displaySize['height'] / 2) + 100;
        });

        // Only add listeners if they do not exist yet
        if (!this.socketClient.hasListeners(Constants.MSG_TYPES_START_GAME + "_SUCCESS")) {
            // Listen for whether any player has started the game for the room
            this.socketClient.on(Constants.MSG_TYPES_START_GAME + "_SUCCESS", (startGameObject: object) => {
                console.log("START GAME!")
                console.log(startGameObject)
                const gameMap = JSON.parse(startGameObject['map'])
                const roomWidth = gameMap["height"];
                const roomHeight = gameMap["width"];
                const numEdges = gameMap['numEdges']
                const numPoints = gameMap['numPoints']
                const numPolygons = gameMap['numPolygons']
                const allEdges = gameMap['allEdges']
                const allPoints = gameMap['allPoints']
                const allPolygons = gameMap['allPolygons']

                // Get game room information from server
                const lightPlayerIds = JSON.parse(startGameObject['lightPlayerIds'])

                const playerInformationArray = startGameObject['players'];
                const numPlayers = playerInformationArray.length;
                let playerId = -1;
                for (let playerIndex = 0; playerIndex < numPlayers; ++playerIndex) {
                    const currentPlayerInformation = playerInformationArray[playerIndex];
                    if (currentPlayerInformation['username'] == this.playerUsername) {
                        playerId = currentPlayerInformation['id']
                    }
                }

                // TODO: What to do if server breaks, or player joins game not allowed to?
                if (playerId == -1) {
                    return;
                }
                
                this.scene.start('game', {socketClient: this.socketClient, playerId, playerUsername: this.playerUsername, roomId: this.roomId, lightPlayerIds, roomWidth, roomHeight, numEdges, numPoints, numPolygons, allEdges, allPoints, allPolygons});
            })

            this.socketClient.on(Constants.MSG_TYPES_START_GAME + "_FAILURE", () => {
                // TODO: Better error handling
                this.scene.start('title');
            })

            this.socketClient.on(Constants.LEAVE_ROOM_SUCCESS, () => {
                // Back to title room if successful
                console.log(`LEAVING WAITING ROOM for ${this.roomId}`)
                this.scene.start('title');
            })
        }
    }

    update() {
        // Deletes previous text in case usernames have updated in the room
        for (let usernamesIndex = 0; usernamesIndex < this.textOfUsernames.length; ++usernamesIndex) {
            this.textOfUsernames[usernamesIndex].destroy();
        }

        this.textOfUsernames = [];

        // Display users in the room, and highlight which is the current players
        for (let playerIndex = 0; playerIndex < this.roomUsernames.length; ++playerIndex) {
            const textX = (window.outerWidth / 2) - 350;
            const textY = (window.outerHeight / 2) - 170 + (playerIndex * 40);
            const currentUsername = this.roomUsernames[playerIndex]
            if (this.playerUsername == currentUsername) {
                this.textOfUsernames.push(this.add.text(textX, textY, `${playerIndex + 1}) ${this.roomUsernames[playerIndex]} <- YOU`, { fill: '#0ff', fontSize: '30px'  }))
            } else {
                this.textOfUsernames.push(this.add.text(textX, textY, `${playerIndex + 1}) ${this.roomUsernames[playerIndex]}`, { fill: '#0f0', fontSize: '30px'  }))
            }
        }
    }
    
    startGame() {
        // TODO: Pass the roomId to the game scene
        this.socketClient.emit(Constants.MSG_TYPES_START_GAME, this.roomId);
    }

    backButtonAction() {
        this.socketClient.emit(Constants.LEAVE_ROOM, {roomId: this.roomId, username: this.playerUsername});
    }

    upload() {

    }
}