"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_1 = __importDefault(require("webpack"));
const webpack_common_js_1 = __importDefault(require("../client/webpack.common.js"));
const server_1 = require("./server");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env.SERVER_HOST) {
        console.log("Please provide the server host env");
        process.exit();
    }
    if (process.env.NODE_ENV != 'development') {
        const compiler = webpack_1.default(webpack_common_js_1.default);
        yield new Promise((resolve, reject) => {
            console.log('compiling front end');
            compiler.run((err, stats) => {
                if (err) {
                    console.log(err);
                    process.exit(-1);
                    reject();
                }
                else {
                    console.log(stats.toString({
                        chunks: true,
                        colors: true
                    }));
                    resolve();
                }
            });
        });
    }
    const server = new server_1.Server();
    server.run();
});
main();
