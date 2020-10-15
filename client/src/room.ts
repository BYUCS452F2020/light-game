import * as Phaser from 'phaser'
import ioclient from 'socket.io-client';
import { Constants } from '../../shared/constants';

export class RoomScene extends Phaser.Scene {

    socketClient: SocketIOClient.Socket
    title: Phaser.GameObjects.Text;
    roomIdTitle: Phaser.GameObjects.Text;
    startRoomButton: Phaser.GameObjects.Text;
    backButton: Phaser.GameObjects.Text;

    // TODO: Get this from title scene AND pass to other scene for game
    playerUsername: string = null;

    // TODO: Get this from title scene
    roomId: string = null;

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super('room');
    }

    init(data) {
        console.log('init ROOM', data);
        this.playerUsername = data.playerUsername;
        this.roomId = data.roomId;
        this.socketClient = data.socketClient;
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
    }
    
    startGame() {
        // TODO: Pass the roomId to the game scene
        this.socketClient.emit(Constants.MSG_TYPES_START_GAME, this.roomId);
    }

    backButtonAction() {
        this.scene.start('title');
    }

    upload() {

    }
}