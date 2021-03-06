/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-05-10 11:32:45
 */
// tslint:disable-next-line: no-import-side-effect
import "reflect-metadata";
// import * as helper from "think_lib";
import { IOCContainer } from 'koatty_container';
import { CONTROLLER_ROUTER } from "./Constants";
import { Koatty, KoattyContext } from '../Koatty';

/**
 * Indicates that an decorated class is a "component".
 *
 * @export
 * @param {string} [identifier] component name
 * @returns {ClassDecorator}
 */
export function Component(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("COMPONENT", target, identifier);
    };
}

/**
 * Indicates that an decorated class is a "controller".
 *
 * @export
 * @param {string} [path] controller router path
 * @returns {ClassDecorator}
 */
export function Controller(path = ""): ClassDecorator {
    return (target: any) => {
        const identifier = IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("CONTROLLER", target, identifier);
        IOCContainer.savePropertyData(CONTROLLER_ROUTER, path, target, identifier);
    };
}
/**
 * Interface for Controller
 */
export interface IController {
    app: Koatty;
    ctx: KoattyContext;

    __before: () => Promise<any>;
    __after: () => Promise<any>;
    readonly body: (data: any, contentType?: string, encoding?: string) => Promise<any>;
    readonly deny: (code?: number) => void;
    readonly expires: (timeout: number) => void;
    readonly fail: (msg?: Error | string, data?: any, code?: number) => Promise<any>;
    readonly header: (name: string, value?: any) => any;
    readonly json: (data: any) => Promise<any>;
    readonly isGet: () => boolean;
    readonly isMethod: (method: string) => boolean;
    readonly isPost: () => boolean;
    readonly ok: (msg?: string, data?: any, code?: number) => Promise<any>;
    readonly param: (name?: string) => any;
    readonly redirect: (urls: string, alt?: string) => void;
    readonly type: (contentType?: string, encoding?: string | boolean) => string;
}

/**
 * Indicates that an decorated class is a "middleware".
 *
 * @export
 * @param {string} [identifier] middleware name
 * @returns {ClassDecorator}
 */
export function Middleware(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("MIDDLEWARE", target, identifier);
    };
}
/**
 * Interface for Middleware
 */
export interface IMiddleware {
    run: (options: any, app: Koatty) => ((ctx: KoattyContext, next: any) => Promise<any>);
}

/**
 * Indicates that an decorated class is a "service".
 *
 * @export
 * @param {string} [identifier] middleware name
 * @returns {ClassDecorator}
 */
export function Service(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        IOCContainer.saveClass("SERVICE", target, identifier);
    };
}
/**
 * Interface for Service
 */
export interface IService {
    app: Koatty;

    // readonly init: (...arg: any[]) => void;
}

/**
 * Indicates that an decorated class is a "plugin".
 *
 * @export
 * @param {string} [identifier]
 * @returns {ClassDecorator}
 */
export function Plugin(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        // 
        if (!identifier.endsWith("Plugin")) {
            throw Error("Plugin class name must be 'Plugin' suffix.");
        }
        IOCContainer.saveClass("COMPONENT", target, `${identifier}`);
    };
}
/**
 * Interface for Plugin
 */
export interface IPlugin {
    run: (options: any, app: Koatty) => Promise<any>;
}