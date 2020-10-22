"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightPlayer = exports.PlayerClient = void 0;
class PlayerClient {
    constructor(id, x, y, visionDirection, visionAngle, hp, isInLight) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.hp = hp;
        this.visionDirection = visionDirection;
        this.visionAngle = visionAngle;
        this.isInLight = isInLight;
    }
}
exports.PlayerClient = PlayerClient;
class HiddenPlayer {
}
class LightPlayer extends PlayerClient {
}
exports.LightPlayer = LightPlayer;
class Flashlight {
    constructor() {
        this.fov = 40;
    }
}
