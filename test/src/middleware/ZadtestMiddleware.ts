/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-05-18 11:16:44
 */
import { Middleware, Helper, IMiddleware, KoattyContext } from "../../../src/index";

const defaultOptions = {};

@Middleware()
export class ZadtestMiddleware implements IMiddleware {
    run(options: any, app: any) {
        //应用启动执行一次
        app.once('appReady', async () => {
            // app.test = 'wwwwwwwww';
            console.log('Zadtest Middleware');
        });
        return function (ctx: KoattyContext, next: Function) {
            console.log(222222);
            console.log(app.test);
            return next();
        };
    }
}