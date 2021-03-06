/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-07-06 11:21:37
 */

import * as path from "path";
import Koa, { ParameterizedContext, DefaultState, DefaultContext, Next } from "koa";
import * as helper from "think_lib";
import * as logger from "think_logger";
import { Container } from "koatty_container";
import { PREVENT_NEXT_PROCESS } from "./core/Constants";
const pkg = require("../package.json");

/**
 * check node version
 * @return {void} []
 */
const checkEnv = () => {
    let node_engines = pkg.engines.node.slice(1) || "10.0.0";
    node_engines = node_engines.slice(0, node_engines.lastIndexOf("."));
    let nodeVersion = process.version;
    if (nodeVersion[0] === "v") {
        nodeVersion = nodeVersion.slice(1);
    }
    nodeVersion = nodeVersion.slice(0, nodeVersion.lastIndexOf("."));

    if (helper.toNumber(node_engines) > helper.toNumber(nodeVersion)) {
        logger.error(`Koatty need node version > ${node_engines}, current version is ${nodeVersion}, please upgrade it.`);
        process.exit(-1);
    }
};

/**
 * Convert express middleware for koa
 * 
 * @param {function} fn 
 * @returns 
 * @memberof Koatty
 */
const parseExp = function (fn: Function) {
    return function (ctx: KoattyContext, next: Function) {
        if (fn.length < 3) {
            fn(ctx.req, ctx.res);
            return next();
        } else {
            return new Promise((resolve, reject) => {
                fn(ctx.req, ctx.res, (err: Error) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(next());
                    }
                });
            });
        }
    };
};

/**
 *
 * @interface InitOptions
 */
interface InitOptions {
    rootPath?: string;
    appPath?: string;
    appDebug?: boolean;
}

interface ListenOptions {
    port?: number;
    host?: string;
    backlog?: number;
    path?: string;
    exclusive?: boolean;
    readableAll?: boolean;
    writableAll?: boolean;
    ipv6Only?: boolean;
}

/**
 * Koatty Context.
 *
 * @export
 * @interface KoattyContext
 * @extends {Koa.Context}
 */
export interface KoattyContext extends Koa.Context {

    /**
     * Request body parser
     *
     * @memberof KoattyContext
     */
    bodyParser: () => Promise<Object>;

    /**
     * QueryString parser
     *
     * @memberof KoattyContext
     */
    queryParser: () => Object;
}

/**
 * Application
 * @export
 * @class Koatty
 * @extends {Koa}
 * @implements {BaseApp}
 */
export class Koatty extends Koa {
    public env: string;
    public rootPath: string;
    public appPath: string;
    public thinkPath: string;
    public appDebug: boolean;
    public options: InitOptions;
    public container: Container;
    public context: KoattyContext;

    private handelMap: Map<string, any>;

    protected constructor(options: InitOptions) {
        super();
        this.options = options || {};
        this.init();
        this.handelMap = new Map<string, any>();
        // initialize
        this.initialize();
    }

    /**
     * app custom init, must be defined options
     */
    public init() { }


    /**
     * initialize env
     */
    private initialize() {
        //development env is default
        this.appDebug = !!(this.options.appDebug || this.appDebug);

        const env = JSON.stringify(process.execArgv);
        if ((env.indexOf("--production") > -1) || ((process.env.NODE_ENV || "").indexOf("pro") > -1)) {
            this.appDebug = false;
        }

        if (env.indexOf("ts-node") > -1 || env.indexOf("--debug") > -1) {
            this.appDebug = true;
        }
        if (this.appDebug) {
            process.env.NODE_ENV = "development";
            process.env.APP_DEBUG = "true";
        } else {
            process.env.NODE_ENV = "production";
        }

        // check env
        checkEnv();
        //catch error
        this.captureError();
        // define path  
        const rootPath = (this.options && this.options.rootPath) || this.rootPath || process.cwd();
        const appPath = this.appPath || (this.options && this.options.appPath) || path.resolve(rootPath, env.indexOf("ts-node") > -1 ? "src" : "dist");
        const thinkPath = __dirname;
        helper.define(this, "rootPath", rootPath);
        helper.define(this, "appPath", appPath);
        helper.define(this, "thinkPath", thinkPath);
        // app.env
        this.env = process.env.KOATTY_ENV || process.env.NODE_ENV;

        process.env.ROOT_PATH = this.rootPath;
        process.env.APP_PATH = this.appPath;
        process.env.THINK_PATH = this.thinkPath;

        // Compatible with old version
        Reflect.defineProperty(this, "_caches", {
            value: {},
            writable: true,
            configurable: false,
            enumerable: false
        });
    }

    /**
     * Set application cache
     *
     * @param {string} key
     * @param {*} value
     * @memberof Koatty
     */
    setMap(key: string, value: any) {
        return this.handelMap.set(key, value);
    }

    /**
     * Get application cache by key
     *
     * @param {string} key
     * @memberof Koatty
     */
    getMap(key: string) {
        return this.handelMap.get(key);
    }

    /**
     * Use the given koa middleware `fn`.
     * support generator func
     * @param {Function} fn
     * @returns {any}
     * @memberof Koatty
     */
    public use(fn: any): any {
        if (!helper.isFunction) {
            logger.error("The paramer is not a function.");
            return;
        }
        if (helper.isGenerator(fn)) {
            fn = helper.generatorToPromise(<GeneratorFunction>fn);
        }
        return super.use(fn);
    }

    /**
     * Use the given Express middleware `fn`.
     * 
     * @param {function} fn 
     * @returns {any}
     * @memberof Koatty
     */
    public useExp(fn: Function): any {
        if (!helper.isFunction) {
            logger.error("The paramer is not a function.");
            return;
        }
        fn = parseExp(fn);
        return this.use(fn);
    }


    /**
     * Prevent next process
     * 
     * @returns {any}
     * @memberof Koatty
     */
    public prevent() {
        return Promise.reject(new Error(PREVENT_NEXT_PROCESS));
    }

    /**
     * Check is prevent error
     * 
     * @param {any} err 
     * @returns {any}
     * @memberof Koatty
     */
    public isPrevent(err: any) {
        return helper.isError(err) && err.message === PREVENT_NEXT_PROCESS;
    }

    /**
     * Read app configuration
     * 
     * @param {any} name 
     * @param {string} [type="config"] 
     * @memberof Koatty
     */
    public config(name: string, type = "config") {
        try {
            const caches = this.getMap("configs") || {};
            // tslint:disable-next-line: no-unused-expression
            caches[type] || (caches[type] = {});
            if (name === undefined) {
                return caches[type];
            }
            if (helper.isString(name)) {
                //name不含. 一级
                if (name.indexOf(".") === -1) {
                    return caches[type][name];
                } else { //name包含. 二级
                    const keys = name.split(".");
                    const value = caches[type][keys[0]] || {};
                    return value[keys[1]];
                }
            } else {
                return caches[type][name];
            }
        } catch (err) {
            logger.error(err);
            return null;
        }
    }

    /**
     * Shorthand for:
     * http.createServer(app.callback()).listen(...)
     * 
     * opts {
     * *   port?: number;
     * *   host?: string;
     * *   backlog?: number;
     * *   path?: string;
     * *   exclusive?: boolean;
     * *   readableAll?: boolean;
     * *   writableAll?: boolean;
     * *   ipv6Only?: boolean; //default false
     * 
     * }
     */
    // tslint:disable-next-line: no-object-literal-type-assertion
    public listen(opts: any = <ListenOptions>{
        host: "127.0.0.1",
        port: 3000
    }, listeningListener?: any) {
        //start server
        return super.listen(opts, listeningListener).on("clientError", function (err: any, sock: any) {
            // logger.error("Bad request, HTTP parse error");
            sock.end("400 Bad Request\r\n\r\n");
        });
    }

    /**
     * registration exception handling
     * 
     * @memberof Koatty
     */
    private captureError(): void {
        //koa error
        this.removeAllListeners("error");
        this.on("error", (err: any) => {
            if (!this.isPrevent(err)) {
                logger.error(err);
            }
            return;
        });
        //warning
        process.removeAllListeners("warning");
        process.on("warning", (warning) => {
            logger.warn(helper.toString(warning));
            return;
        });

        //promise reject error
        process.removeAllListeners("unhandledRejection");
        process.on("unhandledRejection", (reason) => {
            if (!this.isPrevent(reason)) {
                logger.error(helper.toString(reason));
            }
            return;
        });
        //ubcaugth exception
        process.removeAllListeners("uncaughtException");
        process.on("uncaughtException", (err) => {
            if (err.message.indexOf("EADDRINUSE") > -1) {
                logger.error(helper.toString(err));
                process.exit(-1);
            }
            if (!this.isPrevent(err)) {
                logger.error(helper.toString(err));
            }
            return;
        });
    }
}

// const propertys = ["constructor", "init"];
// export const Koatty = new Proxy(Application, {
//     set(target, key, value, receiver) {
//         if (Reflect.get(target, key, receiver) === undefined) {
//             return Reflect.set(target, key, value, receiver);
//         } else if (key === "init") {
//             return Reflect.set(target, key, value, receiver);
//         } else {
//             throw Error("Cannot redefine getter-only property");
//         }
//     },
//     deleteProperty(target, key) {
//         throw Error("Cannot delete getter-only property");
//     },
//     construct(target, args, newTarget) {
//         Reflect.ownKeys(target.prototype).map((n) => {
//             if (newTarget.prototype.hasOwnProperty(n) && !propertys.includes(helper.toString(n))) {
//                 throw Error(`Cannot override the final method '${helper.toString(n)}'`);
//             }
//         });
//         return Reflect.construct(target, args, newTarget);
//     }
// });
