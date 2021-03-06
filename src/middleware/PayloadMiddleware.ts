/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-05-18 11:16:22
 */
import { Middleware, IMiddleware } from "../core/Component";
import { Koatty } from "../Koatty";
const payloads = require("think_payload");

@Middleware()
export class PayloadMiddleware implements IMiddleware {
    run(options: any, app: Koatty) {
        return payloads(options, app);
    }
}