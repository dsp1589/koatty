/*
 * @Author: richen
 * @Date: 2020-07-06 15:53:37
 * @LastEditTime: 2020-07-24 14:39:53
 * @Description:
 * @Copyright (c) - <richenlin(at)gmail.com>
 */
import { Koatty } from "../Koatty";
import http2 from "http2";
import fs from "fs";
import logger from "think_logger";
import * as helper from "think_lib";
const pkg = require("../../package.json");

interface ListeningOptions {
    hostname: string;
    port: number;
    listenUrl: string;
}

/**
 * Listening callback function
 *
 * @param {Koatty} app
 * @param {ListeningOptions} options
 * @returns {*} 
 */
function listening(app: Koatty, options: ListeningOptions) {
    return function () {
        logger.custom("think", "", `Nodejs Version: ${process.version}`);
        logger.custom("think", "", `${pkg.name} Version: v${pkg.version}`);
        logger.custom("think", "", `App Enviroment: ${app.env}`);
        logger.custom("think", "", `Server running at ${options.listenUrl}`);
        logger.custom("think", "", "====================================");
        // tslint:disable-next-line: no-unused-expression
        app.appDebug && logger.warn(`Running in debug mode.`);
    };
}

/**
 * Start HTTP server.
 *
 * @param {Koatty} app
 */
export function startHTTP(app: Koatty) {
    const port = app.config("app_port") || 3000;
    const hostname = app.config("app_hostname") || "localhost";

    logger.custom("think", "", `Protocol: HTTP/1.1`);
    app.listen({ port, hostname }, listening(app, { hostname, port, listenUrl: `http://${hostname}:${port}/` }));
}

/**
 * Start HTTP2 server.
 *
 * @param {Koatty} app
 */
export function startHTTP2(app: Koatty) {
    const port = app.config("app_port") || 443;
    const hostname = app.config("app_hostname") || "localhost";
    const keyFile = app.config("key_file") || "";
    const crtFile = app.config("crt_file") || "";
    if (!helper.isFile(keyFile) || !helper.isFile(crtFile)) {
        logger.error("key_file, crt_file are not defined in the configuration");
        process.exit();
    }
    const options = {
        allowHTTP1: true,
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(crtFile)
    };

    logger.custom("think", "", `Protocol: HTTP/2`);
    const server = http2.createSecureServer(options, app.callback());
    server.listen(port, hostname, 0, listening(app, { hostname, port, listenUrl: `https://${hostname}:${port}/` }));
}

/**
 * Start Socket server.
 *
 * @param {Koatty} app
 */
export function startSocket(app: Koatty) {
    //...
}