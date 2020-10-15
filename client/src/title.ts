import * as Phaser from 'phaser'
import ioclient from 'socket.io-client';
import { Constants } from '../../shared/constants';

export class TitleScene extends Phaser.Scene {

    socketClient: SocketIOClient.Socket
    title: Phaser.GameObjects.Text;
    startRoomButton: Phaser.GameObjects.Text;
    joinRoomButton: Phaser.GameObjects.Text;

    // TODO: Pass to other scene for game
    playerUsername: string = "Test-UserName-" + Math.floor(Math.random() * 1000); // TODO: Not always unique

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super('title')
        this.socketClient = ioclient(process.env.SERVER_HOST);
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
    }
    
    startRoom() {
        this.socketClient.emit(Constants.CREATE_ROOM, this.playerUsername);
        this.socketClient.on(Constants.CREATE_ROOM + "_SUCCESS", (roomId: string) => {
            // Join the loading room if successful
            console.log(`CREATING WAITING ROOM for ${roomId}`)
            this.scene.start('room', {playerUsername: this.playerUsername, roomId, socketClient: this.socketClient});
        })
    }

    joinRoom(roomId) {
        // TODO: Verify roomid before launching the room scene
        this.socketClient.emit(Constants.JOIN_ROOM, {roomId, username: this.playerUsername});
        this.socketClient.on(Constants.JOIN_ROOM + "_SUCCESS", (roomId: string) => {
            // Join the loading room if successful
            console.log(`LOADING WAITING ROOM for ${roomId}`)
            this.scene.start('room', {playerUsername: this.playerUsername, roomId, socketClient: this.socketClient});
        })
    }

    upload() {

    }
}