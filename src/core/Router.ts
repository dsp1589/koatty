/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-07-06 14:23:43
 */
import KoaRouter from "@koa/router";
import * as helper from "think_lib";
import * as logger from "think_logger";
import { Koatty, KoattyContext } from "../Koatty";
import { IOCContainer } from 'koatty_container';
import { checkParams, PARAM_RULE_KEY, PARAM_CHECK_KEY } from 'koatty_validtion';
import { CONTROLLER_ROUTER, ROUTER_KEY, PARAM_KEY } from "./Constants";
import { recursiveGetMetadata } from "../util/Lib";

/**
 * Http timeout timer
 * @param tmr 
 * @param timeout 
 */
// const timer = function (tmr: any, timeout: number) {
//     return new Promise((resolve, reject) => {
//         tmr = setTimeout(function () {
//             const err: any = new Error("Request timeout");
//             err.status = 408;
//             reject(err);
//         }, timeout);
//     });
// };


/**
 *
 *
 * @param {Koatty} app
 * @param {*} target
 * @param {*} [instance]
 * @returns {*} 
 */
function injectRouter(app: Koatty, target: any, instance?: any) {
    // Controller router path
    const metaDatas = IOCContainer.listPropertyData(CONTROLLER_ROUTER, target);
    let path = "";
    const identifier = IOCContainer.getIdentifier(target);
    if (metaDatas) {
        path = metaDatas[identifier] || "";
    }
    path = path.startsWith("/") || path === "" ? path : `/${path}`;

    const rmetaData = recursiveGetMetadata(ROUTER_KEY, target);
    const router: any = {};
    // tslint:disable-next-line: forin
    for (const metaKey in rmetaData) {
        // tslint:disable-next-line: no-unused-expression
        process.env.APP_DEBUG && logger.custom("think", "", `Register inject method Router key: ${metaKey} => value: ${JSON.stringify(rmetaData[metaKey])}`);
        //.sort((a, b) => b.priority - a.priority) 
        for (const val of rmetaData[metaKey]) {
            const tmp = {
                ...val,
                path: `${path}${val.path}`.replace("//", "/")
            };
            router[`${tmp.path}-${tmp.requestMethod}`] = tmp;
        }
    }

    return router;
}

/**
 *
 *
 * @param {Koatty} app
 * @param {*} target
 * @param {*} [instance]
 * @returns {*} 
 */
function injectParam(app: Koatty, target: any, instance?: any) {
    instance = instance || target.prototype;
    // const methods = getMethodNames(target);
    const metaDatas = recursiveGetMetadata(PARAM_KEY, target);
    const vaildMetaDatas = recursiveGetMetadata(PARAM_RULE_KEY, target);
    const vaildatedMetaDatas = recursiveGetMetadata(PARAM_CHECK_KEY, target);
    const argsMetaObj: any = {};
    for (const meta in metaDatas) {
        if (instance[meta] && instance[meta].length <= metaDatas[meta].length) {
            // tslint:disable-next-line: no-unused-expression
            process.env.APP_DEBUG && logger.custom("think", "", `Register inject ${IOCContainer.getIdentifier(target)} param key: ${helper.toString(meta)} => value: ${JSON.stringify(metaDatas[meta])}`);

            // cover to obj
            const data = (metaDatas[meta] || []).sort((a: any, b: any) => a.index - b.index);
            const vaildData = vaildMetaDatas[meta] || [];
            const vaildMetaObj: any = {};
            data.map((v: any) => {
                vaildData.map((it: any) => {
                    if (v.index === it.index) {
                        vaildMetaObj[v.index] = it;
                    }
                });
            });
            argsMetaObj[meta] = {
                valids: vaildMetaObj,
                data,
                dtoCheck: (vaildatedMetaDatas[meta] && vaildatedMetaDatas[meta].dtoCheck) ? true : false
            };
        }
    }
    return argsMetaObj;
}


/**
 * Convert paramter types and valid check.
 *
 * @param {Koatty} app
 * @param {KoattyContext} ctx
 * @param {any[]} params
 * @returns
 */
async function getParamter(app: Koatty, ctx: KoattyContext, ctlParams: any = {}) {
    //convert type
    const params = ctlParams.data || [];
    const validRules = ctlParams.valids || {};
    const dtoCheck = ctlParams.dtoCheck || false;
    const props: any[] = params.map(async function (v: any, k: number) {
        let value: any = null;
        if (v.fn && helper.isFunction(v.fn)) {
            value = await v.fn(ctx);
        }
        //check params
        return checkParams(value, {
            index: k,
            isDto: v.isDto,
            type: v.type,
            validRules,
            dtoCheck
        });
    });
    return Promise.all(props);
}

/**
 * Router class
 */
export class Router {
    app: Koatty;
    options: any;

    constructor(app: Koatty, options?: any) {
        this.app = app;
        // prefix: string;
        // /**
        //  * Methods which should be supported by the router.
        //  */
        // methods ?: string[];
        // routerPath ?: string;
        // /**
        //  * Whether or not routing should be case-sensitive.
        //  */
        // sensitive ?: boolean;
        // /**
        //  * Whether or not routes should matched strictly.
        //  *
        //  * If strict matching is enabled, the trailing slash is taken into
        //  * account when matching routes.
        //  */
        // strict ?: boolean;
        this.options = {
            ...options
        };
    }

    /**
     * Loading router
     *
     * @memberof Router
     */
    loadRouter() {
        try {
            const app = this.app;
            const execRouter = this.execRouter;

            const controllers = app.getMap("controllers") || {};
            const kRouter: any = new KoaRouter(this.options);
            // tslint:disable-next-line: forin
            for (const n in controllers) {
                const ctl = IOCContainer.getClass(n, "CONTROLLER");
                // inject router
                const ctlRouters = injectRouter(app, ctl);
                // inject param
                const ctlParams = injectParam(app, ctl);
                // tslint:disable-next-line: forin
                for (const it in ctlRouters) {
                    // tslint:disable-next-line: no-unused-expression
                    app.appDebug && logger.custom("think", "", `Register request mapping: [${ctlRouters[it].requestMethod}] : ["${ctlRouters[it].path}" => ${n}.${ctlRouters[it].method}]`);
                    kRouter[ctlRouters[it].requestMethod](ctlRouters[it].path, function (ctx: KoattyContext): Promise<any> {
                        const router = ctlRouters[it];
                        return execRouter(app, ctx, n, router, ctlParams[router.method]);
                    });
                }
            }

            app.use(kRouter.routes()).use(kRouter.allowedMethods());
            helper.define(app, "Router", kRouter);
        } catch (err) {
            logger.error(err);
        }
    }

    /**
     * Execute controller
     *
     * @param {Koatty} app
     * @param {KoattyContext} ctx
     * @param {string} identifier
     * @param {*} router
     * @param {*} ctlParams
     * @returns
     * @memberof Router
     */
    async execRouter(app: Koatty, ctx: KoattyContext, identifier: string, router: any, ctlParams: any) {
        const ctl: any = IOCContainer.get(identifier, "CONTROLLER", [ctx]);
        try {
            // const ctl: any = container.get(identifier, "CONTROLLER");
            if (!ctx || !ctl.init) {
                return ctx.throw(404, `Controller ${identifier} not found.`);
            }
            // pre-method
            if (ctl.__before) {
                logger.info(`Execute the aspect ${identifier}.__before()`);
                await ctl.__before();
            }
            // inject param
            let args = [];
            if (ctlParams) {
                args = await getParamter(app, ctx, ctlParams);
            }
            // method
            const res = await ctl[router.method](...args);
            return (res === undefined ? "" : res);
        } catch (err) {
            if (!helper.isError(err)) {
                throw Error(`${err} at ${identifier}.${router.method}`);
            }
            throw err;
        } finally {
            // after-method
            if (ctl.__after) {
                logger.info(`Execute the aspect ${identifier}.__after()`);
                await ctl.__after().catch((e: any) => logger.error(e));
            }
        }
    }
}