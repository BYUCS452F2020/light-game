import * as Phaser from 'phaser'
import { PlayerClient } from './models'

import { MapLocation, Line, Obstacle, Lever } from '../../shared/models'
import { calculateRayPolygon } from '../../shared/vision_calculator'
import * as Encoder from '../../shared/encoder';
import { Constants } from '../../shared/constants';
import { priorityQueue } from '../../shared/priority_queue';
import { Point } from '../../shared/point';

export class GameState extends Phaser.Scene {
  static roomWidth: number;
  static roomHeight: number;

  socketClient: SocketIOClient.Socket

  allPoints: MapLocation[] = []
  allEdges: Line[] = []
  obstacles: Obstacle[] = []
  levers: Lever[] = []

  numPoints: number = 0;
  numEdges: number = 0;
  numPolygons: number = 0;

  keyUP: Phaser.Input.Keyboard.Key;
  keyDOWN: Phaser.Input.Keyboard.Key;
  keyLEFT: Phaser.Input.Keyboard.Key;
  keyRIGHT: Phaser.Input.Keyboard.Key;
  
  keyExpandLight: Phaser.Input.Keyboard.Key;
  keyRestrictLight: Phaser.Input.Keyboard.Key;
  keyLightClockwise: Phaser.Input.Keyboard.Key;
  keyLightCounterclockwise: Phaser.Input.Keyboard.Key;

  mouse: Phaser.Input.Pointer;
  previousMouseX: number = 0;
  previousMouseY: number = 0;

  circleX: number = 200;
  circleY: number = 290;
  playerId: number = -1; // Used to detect which player information is this person's
  playerUsername: string = null;
  roomId: string = null;

  players: PlayerClient[]
  lightPlayerIds: number[]
  isLightPlayer: boolean // Cached version of above, but relative to this player's id

  light_polygon = new Phaser.Geom.Polygon()
  circle = new Phaser.Geom.Circle(this.circleX, this.circleY, 5);

  // Player 2 position data
  hiddenX: number = 500;
  hiddenY: number = 500;
  hiddenCircle = new Phaser.Geom.Circle(this.hiddenX, this.hiddenY, 5);
  hiddenDirection: number = 90 * Math.PI/180;
  hiddenAngle: number = 90 * Math.PI/180;
  hidden_polygon = new Phaser.Geom.Polygon();
  hiddenIsFlashlight = true; // Whether the vision of this player is of a flashlight form (not whether they are on the light team)

  flashlightAngle = 90 * Math.PI/180;
  flashlightDirection = 90 * Math.PI/180;
  flashlightHealth = 100;
  isFlashlight = true; // Whether the vision of this player is of a flashlight form (not whether they are on the light team)

  dynamicGraphics: Phaser.GameObjects.Graphics;
  lightGraphics: Phaser.GameObjects.Graphics;
  staticGraphics: Phaser.GameObjects.Graphics;
  maskGraphics: Phaser.GameObjects.Graphics;

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
      // TODO: Not sure how else this phaser scene is supposed to be created
      super('game')
    }

    init(data) {
      // TODO: Get initial player x/y information from game server?
      console.log('init GAME', data);
      this.socketClient = data.socketClient;
      this.playerId = data.playerId;
      this.playerUsername = data.playerUsername;
      this.roomId = data.roomId;
      this.lightPlayerIds = data.lightPlayerIds;
      GameState.roomWidth = data.height;
      GameState.roomHeight = data.width;
      this.numEdges = data.numEdges;
      this.numPoints = data.numPoints;
      this.numPolygons = data.numPolygons;
      this.allEdges = data.allEdges;
      this.allPoints = data.allPoints;
      this.obstacles = data.obstacles;
      this.levers = data.levers;
      console.log(this.levers)
    }

    preload() {
      // Only add a listener if it doesn't exist yet
      if (!this.socketClient.hasListeners(Constants.MSG_TYPES_GAME_UPDATE)) {
        this.socketClient.on(Constants.MSG_TYPES_GAME_UPDATE, (encodedPlayers: Uint16Array) => {
          this.players = Encoder.decodeUpdate(encodedPlayers);
        })
      }
      // this.load.setBaseURL('http://labs.phaser.io')
      // this.load.image('sky', 'assets/skies/space3.png')
      // this.load.image('logo', 'assets/sprites/phaser3-logo.png')
      // this.load.image('red', 'assets/particles/red.png')
  }

   create() {
    // NOTE: The order of graphics generated is the z-value of the graphics drawn
    this.staticGraphics = this.add.graphics({x: 0, y: 0, lineStyle: { width: 4, color: 0xaa00aa } });
    this.lightGraphics = this.add.graphics({ x: 0, y: 0, lineStyle: { width: 4, color: 0xaa00aa } });
    this.dynamicGraphics = this.add.graphics({ x: 0, y: 0, lineStyle: { width: 4, color: 0xaa00aa } });
    this.maskGraphics = this.add.graphics({ x: 0, y: 0, lineStyle: { width: 20, color: 0xffffff, alpha: 0.5 } });

    // Rules for the alpha mask
    this.maskGraphics.visible = false;
    const geometryMask = new Phaser.Display.Masks.GeometryMask(this, this.maskGraphics);
    this.lightGraphics.mask = geometryMask;
    this.staticGraphics.mask = geometryMask;
    this.dynamicGraphics.mask = geometryMask;

    // Setup controls for user
    this.keyUP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyDOWN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyLEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyRIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.mouse = this.input.mousePointer;
    
    this.keyExpandLight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyRestrictLight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Draw the room using the static graphics object
    for (let index = 0; index < this.numPolygons; ++index) {
      const currentPolygon = this.obstacles[index]
      this.staticGraphics.fillStyle(currentPolygon.color)
      const interpretablePoints: Phaser.Geom.Point[] = currentPolygon.points.map((maplocation: MapLocation) => new Phaser.Geom.Point(maplocation.x, maplocation.y))
      this.staticGraphics.fillPoints(interpretablePoints, true);
    }

    // Camera settings
    this.cameras.main.setBounds(0, 0, GameState.roomWidth + 90, GameState.roomWidth);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(0, 0);
  }

  handlePlayerKeyboardInput() {
    // Mouse.previousposition sometimes does not update every frame
    if ((this.keyUP.isUp && this.keyDOWN.isUp && this.keyLEFT.isUp && this.keyRIGHT.isUp && this.keyExpandLight.isUp && this.keyRestrictLight.isUp)
     && (this.previousMouseX == this.mouse.position.x && this.previousMouseY == this.mouse.position.y)) {
      return
    }

    this.previousMouseX = this.mouse.x;
    this.previousMouseY = this.mouse.y;
    this.socketClient.emit(Constants.MSG_TYPES_INPUT,
      {roomId: this.roomId, encodedMessage:
        Encoder.encodeInput(this.mouse.x, 
          this.mouse.y, 
          this.keyUP.isDown, 
          this.keyDOWN.isDown, 
          this.keyLEFT.isDown, 
          this.keyRIGHT.isDown,
          this.keyExpandLight.isDown,
          this.keyRestrictLight.isDown)
        }
      );
  }

  drawPlayerHealthbar(player: PlayerClient) {
    // Temporary healthbars for this player
    this.dynamicGraphics.fillStyle(0xffffff, 0.5)
    this.dynamicGraphics.fillRect(player.x - 50, player.y - 20, 100, 10);
    this.dynamicGraphics.fillStyle(player.hp, 1.0)
    this.dynamicGraphics.fillRect(player.x - 50, player.y - 20, player.hp, 10);
  }
  
  // Is called on every frame
  update() {

    // Significantly enhances performance by removing previously rendered objects
    this.dynamicGraphics.clear();
    this.lightGraphics.clear();
    this.maskGraphics.clear();

  
    this.handlePlayerKeyboardInput()

    // Draw players and their respective information (when they are returned by the server)
    if (this.players) {
      let numPlayers = this.players.length;

      for (let index = 0; index < numPlayers; ++index) {
        const currentPlayer = this.players[index];

        // TODO: Change the "true" to what the game says the player's config is
        const isFlashlight = true;
        const lightPointOrder = calculateRayPolygon(currentPlayer.x, currentPlayer.y, currentPlayer.visionDirection, currentPlayer.visionAngle, isFlashlight, this.allPoints, this.allEdges);
        let visionPolygon = new Phaser.Geom.Polygon();
        visionPolygon.setTo(lightPointOrder);

        // Draw the person's vision polygon
        // Color is depending if the person is the light or dark team
        // TODO: Since light player ids is not defined until the game has started, we check for its existance first (should probably change later, because everyone is dark player for a moment)
        if (this.lightPlayerIds && this.lightPlayerIds.includes(currentPlayer.id)) { 
          // Brighten the area seen with a slight white light
          this.lightGraphics.fillStyle(0xffffff, 0.1)
        } else {
          // Don't add any flare for what dark players see
          this.lightGraphics.fillStyle(0x0a0a0a, 0)
        }

        // TODO: Not sure why there is a bug that the polygon points are not more than 2 points (maybe the polygon points are undefined)
        if (visionPolygon.points.length > 2) {
          // If this player is on the light team, then draw only players that are on the light team
          if (this.lightPlayerIds && this.lightPlayerIds.includes(this.playerId)) {
            if (this.lightPlayerIds.includes(currentPlayer.id)) {
              // Apply an alpha mask for the light sources on light team
              this.maskGraphics.fillPoints(visionPolygon.points, true);
              this.lightGraphics.fillPoints(visionPolygon.points, true);
            }
          } else {
            // If this player is on the dark team, then draw everyone's vision polygons
            // Apply an alpha mask for the light sources on light team
            this.maskGraphics.fillPoints(visionPolygon.points, true);
            // this.lightGraphics.fillPoints(visionPolygon.points, true);
          }
        }

        // Draw players using separate graphics object so as to maintain a high z-index for drawing
        // Color is depending if it is this person (red for this, blue for other)
        if (currentPlayer.id == this.playerId) {
          this.dynamicGraphics.fillStyle(0xff0000) 
        } else {
          this.dynamicGraphics.fillStyle(0x0000ff);
        }

        // Only draw positions of players on same team if it is light team
        if (this.lightPlayerIds && this.lightPlayerIds.includes(this.playerId)) {
          if (this.lightPlayerIds.includes(currentPlayer.id)) {
            this.dynamicGraphics.fillCircle(currentPlayer.x, currentPlayer.y, 5);
            this.drawPlayerHealthbar(currentPlayer);
          } else {
            // However, draw a dark-team player if it ends up in the light
            if (currentPlayer.isInLight) {
              this.dynamicGraphics.fillCircle(currentPlayer.x, currentPlayer.y, 5);
              this.drawPlayerHealthbar(currentPlayer);
            }
          }
        } else {
          // Otherwise, dark players know where everyone is
          this.dynamicGraphics.fillCircle(currentPlayer.x, currentPlayer.y, 5);
          this.drawPlayerHealthbar(currentPlayer);
        }

        // Draw levers for dark players
        // 16777215 is the max number 0xffffff for color
        const randomColor = Math.floor(Math.random() * 16777216)
        this.dynamicGraphics.lineStyle(5, randomColor, 1)
        if (this.lightPlayerIds && !this.lightPlayerIds.includes(this.playerId)) {
          for (let leverIndex = 0; leverIndex < this.levers.length; ++leverIndex) {
            const currentLever = this.levers[leverIndex];

            // Levers are on the side of an obstacle, but are generated from the selected point to the next point in the list
            const selectedObstacleForLever = this.obstacles.find(obstacle => obstacle.id == currentLever.polygonId)
            const firstPointForLever = selectedObstacleForLever.points[currentLever.side]
            const secondPointForLever = selectedObstacleForLever.points[(currentLever.side + 1) % selectedObstacleForLever.points.length]
            this.dynamicGraphics.lineBetween(firstPointForLever.x, firstPointForLever.y,secondPointForLever.x, secondPointForLever.y)
          }
        }
      }
    }

    // Check if hidden player is caught in the light (graphical aesthetics)
    // var cam = this.cameras.main;
    // if (this.hidden_player_health > 0) {
    // if (this.light_polygon.contains(this.hiddenX, this.hiddenY)) {
    //     if (!this.was_hidden_player_caught) {
    //       this.cameras.main.flash(250, 255, 0, 0);
    //       this.was_hidden_player_caught = true;
    //     }
        
    //     cam.pan(this.hiddenX, this.hiddenY, 2000, 'Elastic', true);
    //     cam.zoomTo(2, 1000, 'Elastic', true);
        
    //     this.cameras.main.shake(100, 0.005);
    //   } else {
    //     if (this.was_hidden_player_caught) {
    //       this.was_hidden_player_caught = false;
    //     }
        
    //     cam.pan(0, 0, 2000, 'Elastic', true);
    //     cam.zoomTo(1, 1000, 'Elastic', true);
    //   }
    // } else {
    //   // Game Is Over
    //   cam.pan(0, 0, 2000, 'Elastic', true);
    //   cam.zoomTo(1, 1000, 'Elastic', true);
    //   let text = this.add.text(GameState.roomWidth/2 - 80, GameState.roomHeight/2 - 30, 'Light WINS!').setFontSize(34).setScrollFactor(0);
    //   text.setShadow(1, 1, '#000000', 2);
    // }
  }
}