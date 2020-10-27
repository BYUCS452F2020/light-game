import { use } from 'matter';
import * as Phaser from 'phaser'
import ioclient from 'socket.io-client';
import { Constants } from '../../shared/constants';

export class AuthenticationScene extends Phaser.Scene {

    socketClient: SocketIOClient.Socket
    title: Phaser.GameObjects.Text;
    loadingText: Phaser.GameObjects.Text;
    authentication: Phaser.GameObjects.Text;
    createUsernameButton: Phaser.GameObjects.Text;

    // TODO: Pass to other scene for game
    playerUsername: string = null; // TODO: Enforce max of 20 characters
    playerId: string = null; // TODO: Not always unique

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super('auth')
        console.log("STARTED Authentication")
        this.socketClient = ioclient(process.env.SERVER_HOST);
    }

    preload() {

    }

    setCookie(cname: string, cvalue: string, exdays: number) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
      }

    getCookie(cname: string) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i = 0; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }
        return "";
      }

    create() {
        let roomId = 0;
        const titleX = (window.outerWidth / 2) - 150;
        const titleY = (window.outerHeight / 2) - 200;
        this.title = this.add.text(titleX, titleY, 'The Game of Light', { fill: '#0f0', fontSize: '30px' })
        this.loadingText = this.add.text(titleX, titleY + 30, 'Loading Profile...', { fill: '#0f0', fontSize: '30px' })

        // TODO: This Scene is the only place where authentication happens. Is this what we want? 
        // Or should authentication always happen, if the cookie gets deleted?
        const cookiePlayerId = this.getCookie("playerId");
        const cookieUsername = this.getCookie("username");
        console.log("COOKIES")
        console.log(cookiePlayerId, cookieUsername)

        // Checks if player has cookies set
        if (cookiePlayerId == "" || cookieUsername == "") {
            this.loadingText.visible = false;
            const buttonX1 = (window.outerWidth / 2) - 250;
            const buttonY1 = (window.outerHeight / 2) + 50;
            const buttonX2 = buttonX1 + 200;
            const buttonY2 = buttonY1 + 50;
            this.authentication = this.add.text(buttonX1, buttonY1, 'You look like a new user, please enter a username', { fill: '#0f0' })

            const inputElement = document.createElement('input')
            inputElement.id = "usernameInputField"
            inputElement.placeholder = "Enter Username (Max 20 chars)"
            inputElement.type = "text"
            var container = this.add.container(buttonX2 + 50, buttonY2 + 50);
            var element = this.add.dom(0, 0, inputElement, 'background-color: lime; width: 300px; height: 50px; font: 20px Arial', 'Phaser');

            container.add([ element ]);

            this.createUsernameButton = this.add.text(buttonX2, buttonY2, 'Set Username', { fill: '#0f0' })
            .setInteractive()
            .on('pointerdown', () => {
                this.createNewUsername(inputElement.value);
            })
            .on('pointerover', () => this.createUsernameButton.setStyle({ fill: '#ff0'}))
            .on('pointerout', () => this.createUsernameButton.setStyle({ fill: '#0f0'}));
        } else {
            console.log("FIRST")
            this.playerId = cookiePlayerId;
            this.playerUsername = cookieUsername;
            this.scene.start('title', {playerId: this.playerId, playerUsername: this.playerUsername, socketClient: this.socketClient});
        }

        // SocketClient persists throughout the entire time the player is on the website, so we only create these listeners once per session
        if (!this.socketClient.hasListeners(Constants.CREATE_USERNAME)) {
            this.socketClient.on(Constants.CREATE_USERNAME, (playerId: string) => {
                if (playerId) {
                    this.playerId = playerId;
                    this.setCookie("playerId", this.playerId, 365);
                    this.setCookie("username", this.playerUsername, 365);
                    this.scene.start('title', {playerId: this.playerId, playerUsername: this.playerUsername, socketClient: this.socketClient});
                } else {
                    console.error("Failure to create username: ", playerId);
                }
            })
        }
    }

    createNewUsername(username) {
        console.log("CREATING USERNAME: ", username)
        this.playerUsername = username;
        this.authentication.visible = false;
        this.createUsernameButton.visible = false;
        this.socketClient.emit(Constants.CREATE_USERNAME, username);
        this.loadingText.visible = true;
    }

    upload() {

    }
}