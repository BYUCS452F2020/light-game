import * as Phaser from 'phaser'
import { Line } from './line'
import { GameMap, Player, MapLocation, Obstacle } from './models'
import ioclient from 'socket.io-client';

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
  allPolygons: {polygon: Obstacle, color: number}[] = []

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
  circleUsername: string = "Test-UserName-" + Math.floor(Math.random() * 1000); // TODO: Not always unique

  players: {id: number, x: number, y:number, visionDirection: number, visionAngle: number, hp: number}[]
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

  graphics: Phaser.GameObjects.Graphics;
  maskGraphics: Phaser.GameObjects.Graphics;

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
      // TODO: Not sure how else this phaser scene is supposed to be created
      super('room')
    }

    preload() {
      this.socketClient = ioclient('http://localhost:3000');
      // this.socketClient = ioclient('http://ec2-34-222-92-7.us-west-2.compute.amazonaws.com:3000');
      this.socketClient.emit(Constants.MSG_TYPES_JOIN_GAME, this.circleUsername);
      this.socketClient.on(Constants.MSG_TYPES_START_GAME, (startGameObject: object) => {
        console.log("START GAME!")
        console.log(startGameObject)
        const isGameStarted = JSON.parse(startGameObject['isStarted'])
        if (isGameStarted) {
          const gameMap = JSON.parse(startGameObject['map'])
          const lightPlayerIds = JSON.parse(startGameObject['lightPlayerIds'])

          this.lightPlayerIds = lightPlayerIds;
          console.log(lightPlayerIds);
          // this.isLightPlayer = this.lightPlayerIds.includes(this.playerId);
          // Include's extra metadata about each player that we do not need to store (but could be useful later on [leaderboards])
          // const players = JSON.parse(startGameObject['map'])

          
          // this.players = players

          // console.log(isGameStarted)
          // console.log(gameMap)
          // TODO: Test on different sized monitors that have higher pixel densities than others.
          // Thus, rooms either
          // - need to be based on a large minimum fixed size
          // - need to zoom in for large screens
  
          // const polygons = gameMap["obstacles"]
  
          // Get game room information from server
          GameState.roomWidth = gameMap["height"];
          GameState.roomHeight = gameMap["width"];
          this.numEdges = gameMap['numEdges']
          this.numPoints = gameMap['numPoints']
          this.numPolygons = gameMap['numPolygons']
          this.allEdges = gameMap['allEdges']
          this.allPoints = gameMap['allPoints']
          this.allPolygons = gameMap['allPolygons']
        }
      })
      this.socketClient.on(Constants.MSG_TYPES_JOIN_GAME, (args: object) => {
        console.log("JOIN GAME!");
        this.circleX = args['x'];
        this.circleY = args['y'];
        this.playerId = args['id'];
        console.log(args)

        // Attempt to start a game once joined
        this.socketClient.emit(Constants.MSG_TYPES_START_GAME);
      })
      this.socketClient.on(Constants.MSG_TYPES_GAME_UPDATE, (encodedPlayers: Uint16Array) => {
        this.players = Encoder.decodeUpdate(encodedPlayers);

        // console.log(this.players)
        
        // Make sure we update each player correctly
        // let numPlayers = this.players.length;

        // for (let index = 0; index < numPlayers; ++index) {
        //   const currentPlayer = this.players[index];
        //   if (currentPlayer.id == this.playerId) {
        //     this.circleX = currentPlayer['x']
        //     this.circleY = currentPlayer['y']
        //     this.flashlightDirection = currentPlayer['d']
        //     this.flashlightAngle = currentPlayer['a']
        //     this.flashlightHealth = currentPlayer['hp']
        //   } else {
        //     this.hiddenX = currentPlayer['x'] // TODO: Modify to include more than 2 players
        //     this.hiddenY = currentPlayer['y']
        //     this.hiddenDirection = currentPlayer['d']
        //     this.hiddenAngle = currentPlayer['a']
        //     this.hidden_player_health = currentPlayer['hp']
        //   }
        // }
        
      })
      // this.load.setBaseURL('http://labs.phaser.io')
      // this.load.image('sky', 'assets/skies/space3.png')
      // this.load.image('logo', 'assets/sprites/phaser3-logo.png')
      // this.load.image('red', 'assets/particles/red.png')
  }

   create() {
    this.graphics = this.add.graphics({ x: 0, y: 0, lineStyle: { width: 4, color: 0xaa00aa } });
    this.maskGraphics = this.add.graphics({ x: 0, y: 0, lineStyle: { width: 4, color: 0xaa00aa } });

    // Setup controls for user
    this.keyUP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyDOWN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyLEFT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyRIGHT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.mouse = this.input.mousePointer;
    
    this.keyExpandLight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyRestrictLight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Camera settings
    this.cameras.main.setBounds(0, 0, GameState.roomWidth + 90, GameState.roomWidth);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(0, 0);
  }

  // Bounds an angle between -PI and PI (radians version of -180 -> 180 degrees)
  boundAngle(angle: number) {
    angle %= (2*Math.PI)
    if (angle > Math.PI) {
      angle -= 2*Math.PI
    }
    if (angle < -Math.PI) {
      angle += 2*Math.PI
    }
    return angle;
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
        Encoder.encodeInput(this.mouse.x, 
          this.mouse.y, 
          this.keyUP.isDown, 
          this.keyDOWN.isDown, 
          this.keyLEFT.isDown, 
          this.keyRIGHT.isDown,
          this.keyExpandLight.isDown,
          this.keyRestrictLight.isDown)
      );
  }

  // Whether the hidden player was caught in the light the last frame
  was_hidden_player_caught: boolean = false;
  hidden_player_health: number = 100; // How many health points the hidden player has to survive against the light

  calculateRayPolygon(circleX: number, circleY: number, flashlightDirection: number, flashlightAngle: number, isFlashlight: boolean) {

    let lowerRayBounds = this.boundAngle(flashlightDirection - flashlightAngle/2);
    let upperRayBounds = this.boundAngle(flashlightDirection + flashlightAngle/2);

    let rayAngleQueue = priorityQueue<{angle, x, y}>()
  
    // If it is a flashlight, then add the boundary lines first
    if (isFlashlight) {
      let lowerX = circleX + Math.cos(lowerRayBounds) * 50
      let lowerY = circleY + Math.sin(lowerRayBounds) * 50
      let upperX = circleX + Math.cos(upperRayBounds) * 50
      let upperY = circleY + Math.sin(upperRayBounds) * 50
    
      rayAngleQueue.insert({angle: lowerRayBounds, x: lowerX, y: lowerY}, lowerRayBounds);
      rayAngleQueue.insert({angle: upperRayBounds, x: upperX, y: upperY}, upperRayBounds);
    }
    
    // Generate all the rays needed for the game
    for (let outerIndex = 0; outerIndex < this.numPoints; ++outerIndex) {  
      const currentPoint: MapLocation = this.allPoints[outerIndex];
      const diffX: number = currentPoint.x - circleX;
      const diffY: number = currentPoint.y - circleY;
      const rayAngle: number = Math.atan2(diffY, diffX); // Used for priority queue when added later
    
      let beforeAngle = this.boundAngle(rayAngle - 0.00001);
      let afterAngle = this.boundAngle(rayAngle + 0.00001);
    
      const normalBounds = (lowerRayBounds < rayAngle && upperRayBounds > rayAngle)
      // Happens when lower/upper bounds surpass the +-Math.PI mark
      const reversedBounds = (lowerRayBounds > upperRayBounds) && ((-Math.PI < rayAngle && upperRayBounds > rayAngle) || (lowerRayBounds < rayAngle && Math.PI > rayAngle))
      if (!isFlashlight || reversedBounds || normalBounds) {
        rayAngleQueue.insert({angle: beforeAngle, x: currentPoint.x, y: currentPoint.y}, beforeAngle);
        rayAngleQueue.insert({angle: rayAngle, x: currentPoint.x, y: currentPoint.y}, rayAngle);
        rayAngleQueue.insert({angle: afterAngle, x: currentPoint.x, y: currentPoint.y}, afterAngle);
      }
    }
    // This will store the point priority of the light polygon we will create
    let visionQueue = priorityQueue<Point>()
    let rayAngleLength = rayAngleQueue.size()

    // Ray tracing to each point
    for (let outerIndex = 0; outerIndex < rayAngleLength; ++outerIndex) {
      const {angle, x, y} = rayAngleQueue.pop();
      const rayAngle = angle

      const raySlope = Math.tan(rayAngle);
      const rayYIntercept: number = -(raySlope)*circleX + circleY

      let currentCollisionDistance = 100000000000 // TODO: Change to max numrical value?
      let bestCollisionSoFar = {x:-1, y:-1}

      // console.log(`LINE FOUND -> (${circleX},${circleY}, ${currentPoint.x}, ${currentPoint.y}) => (${rayAngle}, ${raySlope} ${rayYIntercept})`)
      // const line: Phaser.Geom.Line = new Phaser.Geom.Line(circleX, circleY, x, y); //Used for debugging
      // graphics.strokeLineShape(line);

      // console.log(`START 4 WITH (${x}, ${y}) with ray angle ${rayAngle * 180/Math.PI} and slope ${raySlope}`)
      for (let innerIndex = 0; innerIndex < this.numEdges; ++innerIndex) {
        // console.log("EDGE " + edgeIndex + " of " + numEdges)
        const currentEdge: Line = this.allEdges[innerIndex];
        let collisionX: number;
        let collisionY: number;
        // Handles verticle polygon lines
        // NOTE: Vertical `raySlope` is handled as a very large number, but not infinity
        // NOTE: Infinity values cannot be sent over socketio, thus we account 'null' values in replacement of Infinity
        // TODO: We can fix the above note to make more sense.
        if (currentEdge.slope == null || currentEdge.slope == Infinity || currentEdge.slope == -Infinity) {
          collisionX = currentEdge.minX;
          collisionY = raySlope*collisionX + rayYIntercept;
        } else {
          collisionX = (rayYIntercept - currentEdge.b) / (currentEdge.slope - raySlope);
          collisionY = currentEdge.slope*collisionX + currentEdge.b;
        }
        // console.log("CURRENT RAY: " + currentEdge.slope)
        // const collisionX: number = (rayYIntercept - currentEdge.b) / (currentEdge.slope - raySlope);
        // const collisionY: number = currentEdge.slope*collisionX + currentEdge.b;

        // console.log(`COLLISION FOUND -> (${collisionX},${collisionY}) for bounds (${currentEdge.x1}, ${currentEdge.y1}) and (${currentEdge.x2}, ${currentEdge.y2}) => (${rayAngle * 180/Math.PI}, ${rayYIntercept})`)
        // console.log(`COLLISION FOUND -> (${collisionX},${collisionY}) for bounds (${currentEdge.minX}, ${currentEdge.maxX}) and (${currentEdge.minY}, ${currentEdge.maxY})`)
        
        // Need a good enough buffer for floating point errors           
        if (collisionX <= currentEdge.maxX + 0.00001 && collisionX >= currentEdge.minX - 0.00001 && 
            collisionY <= currentEdge.maxY + 0.00001 && collisionY >= currentEdge.minY - 0.00001) {
              // Also check if angle to circle is the same
              const distanceToLightOrigin = Math.sqrt(Math.pow(collisionX - circleX, 2) + Math.pow(collisionY - circleY, 2))
              const angleToLight = Math.atan2(collisionY - circleY, collisionX - circleX)

              if (distanceToLightOrigin < currentCollisionDistance && //Check it is closer
                ((angleToLight < rayAngle + 0.001 && angleToLight > rayAngle - 0.001))) { //Check it is in the direction of the ray (including if ray angles jump from 0 to 360 or visa versa)
                  bestCollisionSoFar = {x:collisionX, y:collisionY}
                  currentCollisionDistance = distanceToLightOrigin
              }
        }

        // TODO: Circumstance for when collisions are equal to line edge
      }

      // Add light collision point to priority queue (Dont need priority queue here)
      visionQueue.insert(bestCollisionSoFar, rayAngle);
    }

    // Add circle to light polygon, if it is a flashlight
    if (isFlashlight) {
      let joinAngle = this.boundAngle(flashlightDirection + Math.PI);
      visionQueue.insert({x:circleX, y:circleY}, joinAngle);
    }

    // Generate the polygon
    let finalPointOrder: number[] = []
    while (visionQueue.peek() != null) {
      const nextPoint = visionQueue.pop()
      const pointX = nextPoint.x
      const pointY = nextPoint.y
      finalPointOrder.push(pointX, pointY)
      // console.log(`BEST: (${pointX},${pointY})`)
      // const circle2: Phaser.Geom.Circle = new Phaser.Geom.Circle(pointX, pointY, 5);
      // graphics.fillStyle(0x000000)
      // graphics.fillCircleShape(circle2);
    }

    return finalPointOrder;
  }
  
  // Is called on every frame
  update() {

    // Significantly enhances performance by removing previously rendered objects
    this.graphics.clear()
    this.maskGraphics.clear();

    // TODO: Uncomment these next lines to apply an alpha Mask for the light sources
    // if (this.light_polygon.points.length > 2) {
    //   this.maskGraphics.fillPoints(this.light_polygon.points, true);
    // }
    // this.graphics.mask = new Phaser.Display.Masks.GeometryMask(this, this.maskGraphics);
  
    this.handlePlayerKeyboardInput()
  
    // TODO: Not sure if this can be optimized as an image
    for (let index = 0; index < this.numPolygons; ++index) {
      const currentPolygon = this.allPolygons[index]
      this.graphics.fillStyle(currentPolygon.color)
      // TODO: Do not calculate this every frame
      const interpretablePoints: Phaser.Geom.Point[] = currentPolygon.polygon.points.map((maplocation: MapLocation) => new Phaser.Geom.Point(maplocation.x, maplocation.y))
      this.graphics.fillPoints(interpretablePoints, true);
    }

    // Draw players and their respective information (when they are returned by the server)
    if (this.players) {
      let numPlayers = this.players.length;

      for (let index = 0; index < numPlayers; ++index) {
        const currentPlayer = this.players[index];

        // TODO: Change the "true" to what the game says the player's config is
        const isFlashlight = true;
        const lightPointOrder = this.calculateRayPolygon(currentPlayer.x, currentPlayer.y, currentPlayer.visionDirection, currentPlayer.visionAngle, isFlashlight);
        let visionPolygon = new Phaser.Geom.Polygon();
        visionPolygon.setTo(lightPointOrder);

        // Draw the person's vision polygon
        // Color is depending if the person is the light or dark team
        // TODO: Since light player ids is not defined until the game has started, we check for its existance first (should probably change later, because everyone is dark player for a moment)
        if (this.lightPlayerIds && this.lightPlayerIds.includes(currentPlayer.id)) { 
          this.graphics.fillStyle(0xffff00)
        } else {
          this.graphics.fillStyle(0x0a0a0a)
        }

        // TODO: Not sure why there is a bug that the polygon points are not more than 2 points (maybe the polygon points are undefined)
        if (visionPolygon.points.length > 2) {
          this.graphics.fillPoints(visionPolygon.points, true);
        }

        // Draw the person
        // Color is depending if it is this person (red for this, blue for other)
        if (currentPlayer.id == this.playerId) {
          this.graphics.fillStyle(0xff0000) 
        } else {
          this.graphics.fillStyle(0x0000ff);
        }
        this.graphics.fillCircle(currentPlayer.x, currentPlayer.y, 5);

        // Temporary healthbars for this player
        this.graphics.fillStyle(0xffffff, 0.5)
        this.graphics.fillRect(currentPlayer.x - 50, currentPlayer.y - 20, 100, 10);
        this.graphics.fillStyle(currentPlayer.hp, 1.0)
        this.graphics.fillRect(currentPlayer.x - 50, currentPlayer.y - 20, currentPlayer.hp, 10);
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