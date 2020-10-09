"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = __importDefault(require("socket.io"));
const constants_1 = require("../shared/constants");
const game_1 = __importDefault(require("./game"));
const roomManager_1 = require("./roomManager");
class Server {
    constructor() {
        this.run = () => {
            const port = process.env.PORT || 3000;
            const server = this.app.listen(port);
            console.log(`Server listening on port ${port}`);
            const io = socket_io_1.default(server);
            const game = new game_1.default();
            io.on('connection', (socket) => {
                console.log('Player connected!', socket.id);
                socket.on(constants_1.Constants.JOIN_ROOM, (roomId, username) => this.roomManager.joinRoom(roomId, socket, username));
                socket.on(constants_1.Constants.CREATE_ROOM, (username) => this.roomManager.createRoom(socket, username));
                socket.on(constants_1.Constants.MSG_TYPES_START_GAME, (roomId) => { this.games.set(roomId, this.roomManager.startRoom(roomId)); });
                socket.on(constants_1.Constants.MSG_TYPES_INPUT, (encodedMessage) => game.handleMovementInput(socket, encodedMessage));
                socket.on('disconnect', () => game.players.delete(socket.id));
            });
        };
        this.roomManager = new roomManager_1.RoomManager();
        this.app = express_1.default();
        this.app.use((req, res, next) => { console.log(req.url); next(); });
        this.app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
        this.app.use("/dist", express_1.default.static(path_1.default.join(__dirname, '../dist')));
        this.app.all("/ping", (req, res) => {
            res.sendStatus(200);
        });
    }
}
exports.Server = Server;
