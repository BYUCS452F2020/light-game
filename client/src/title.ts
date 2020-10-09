import * as Phaser from 'phaser'

export class TitleScene extends Phaser.Scene {

    title: Phaser.GameObjects.Text;
    startRoomButton: Phaser.GameObjects.Text;
    joinRoomButton: Phaser.GameObjects.Text;

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super('title')
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

        this.joinRoomButton = this.add.text(buttonX2, buttonY2, 'Join Room', { fill: '#0f0' })
        .setInteractive()
        .on('pointerdown', () => this.joinRoom(roomId) )
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
        this.scene.start('room');
    }

    joinRoom(roomId) {
        // TODO: Verify roomid before launching the room scene
        this.scene.start('room');
    }

    upload() {

    }
}