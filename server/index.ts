import { rejects } from "assert";
import express from "express";
import path, { resolve } from 'path'
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackConfig from '../client/webpack.common.js';

import { Server } from './server'

// todo: wirte script for development mode

const main = async () => {

    if (!process.env.SERVER_HOST) {
        console.log("Please provide the server host env");
        process.exit()
    }

    if (process.env.NODE_ENV != 'development') {


        const compiler = webpack(webpackConfig);
        await new Promise((resolve, reject) => {
            console.log('compiling front end');
            compiler.run((err, stats) => { // Stats Object
                if (err) {
                    console.log(err);
                    process.exit(-1)
                    reject()
                }
                else {
                    console.log(stats.toString({
                        chunks: true,  // Makes the build much quieter
                        colors: true    // Shows colors in the console
                    }))
                    resolve()
                }
            })
        });
    }

    const server: Server = new Server()
    server.run()




}

main()