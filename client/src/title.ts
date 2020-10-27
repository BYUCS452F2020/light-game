import * as Phaser from 'phaser'
import ioclient from 'socket.io-client';
import { Constants } from '../../shared/constants';

export class TitleScene extends Phaser.Scene {

    socketClient: SocketIOClient.Socket
    title: Phaser.GameObjects.Text;
    startRoomButton: Phaser.GameObjects.Text;
    joinRoomButton: Phaser.GameObjects.Text;

    // Get from authentication scene
    playerUsername: string = null;
    playerId: number = null;

    totalGamesPlayed: number = 0;
    totalLightWins: number = 0;
    totalLightGames: number = 0;
    totalDarkWins: number = 0;
    totalDarkGames: number = 0;

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super('title')
        console.log("STARTED TITLE")
    }

    init(data) {
        console.log('init Title', data);
        this.playerId = data.playerId;
        this.playerUsername = data.playerUsername;
        this.socketClient = data.socketClient;
    }

    preload() {

    }

    create() {
        let roomId = 0;
        const titleX = (window.outerWidth / 2) - 150;
        const titleY = (window.outerHeight / 2) - 200;
        this.title = this.add.text(titleX, titleY, 'The Game of Light', { fill: '#0f0', fontSize: '30px' })
        
        const buttonX1 = (window.outerWidth / 2) - 50;
        const buttonY1 = (window.outerHeight / 2) + 50;
        const buttonX2 = buttonX1 + 5;
        const buttonY2 = buttonY1 + 50;
        this.startRoomButton = this.add.text(buttonX1, buttonY1, 'Start Room', { fill: '#0f0' })
        .setInteractive()
        .on('pointerdown', () => this.startRoom() )
        .on('pointerover', () => this.startRoomButton.setStyle({ fill: '#ff0'}))
        .on('pointerout', () => this.startRoomButton.setStyle({ fill: '#0f0'}));

        const inputElement = document.createElement('input')
        inputElement.id = "roomIdInputField"
        inputElement.placeholder = "Enter Room Id"
        inputElement.type = "text"
        var container = this.add.container(buttonX2 + 50, buttonY2 + 50);
        var element = this.add.dom(0, 0, inputElement, 'background-color: lime; width: 200px; height: 50px; font: 20px Arial', 'Phaser');

        container.add([ element ]);

        this.joinRoomButton = this.add.text(buttonX2, buttonY2, 'Join Room', { fill: '#0f0' })
        .setInteractive()
        .on('pointerdown', () => {
            this.joinRoom(inputElement.value);
         })
        .on('pointerover', () => this.joinRoomButton.setStyle({ fill: '#ff0'}))
        .on('pointerout', () => this.joinRoomButton.setStyle({ fill: '#0f0'}));

        this.add.text(10, 10, `Username: ${this.playerUsername}`, { fill: '#0f0', fontSize: '30px' })

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

        // SocketClient persists throughout the entire time the player is on the website, so we only create these listeners once per session
        if (!this.socketClient.hasListeners(Constants.ROOM_CREATED)) {
            this.socketClient.on(Constants.ROOM_CREATED, (roomId: string) => {
                // Join the loading room if successful
                console.log(`CREATING WAITING ROOM for ${roomId}`)
                this.scene.start('room', {playerId: this.playerId, playerUsername: this.playerUsername, roomId, socketClient: this.socketClient});
            })

            this.socketClient.on(Constants.JOIN_ROOM_SUCCESS, (roomId: string) => {
                // Join the loading room if successful
                console.log(`LOADING WAITING ROOM for ${roomId}`)
                this.scene.start('room', {playerId: this.playerId, playerUsername: this.playerUsername, roomId, socketClient: this.socketClient});
            })
            this.socketClient.on(Constants.JOIN_ROOM_FAIL, (reason: string) => {
                console.log(`Failed to join room: ${reason}`);
            })

            this.socketClient.on(Constants.GET_PLAYER_STATS, (data: object) => {
                if (data) {
                    this.totalGamesPlayed = data['TotalGamesPlayed']
                    this.totalDarkWins = data['TotalDarkWins']
                    this.totalDarkGames = data['TotalDarkPlays']
                    this.totalLightWins = data['TotalLightWins']
                    this.totalLightGames = data['TotalLightPlays']

                    this.add.text(10, 40, `Total Games Played: ${this.totalGamesPlayed}`, { fill: '#0f0', fontSize: '20px' })
                    this.add.text(10, 60, `Total Wins (Light Team): ${this.totalLightWins}/${this.totalLightGames}`, { fill: '#0f0', fontSize: '20px' })
                    this.add.text(10, 80, `Total Wins (Dark Team): ${this.totalDarkWins}/${this.totalDarkGames}`, { fill: '#0f0', fontSize: '20px' })
                } else {
                    console.error("Failed to get user stats")
                }
            })
        }

        this.socketClient.emit(Constants.GET_PLAYER_STATS, this.playerId)
    }
    
    startRoom() {
        this.socketClient.emit(Constants.CREATE_ROOM, this.playerId);
    }

    joinRoom(roomId) {
        // TODO: Verify roomid before launching the room scene
        this.socketClient.emit(Constants.JOIN_ROOM, {roomId, playerId: this.playerId});
    }

    upload() {

    }
}