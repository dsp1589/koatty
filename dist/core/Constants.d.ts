export declare const COMPONENTS: Set<unknown>;
export declare const IOC: WeakMap<any, any>;
export declare const COMPONENT = "@@COMPONENT";
export declare const COMPONENT_REG: RegExp;
export declare const CONTROLLER = "@@CONTROLLER";
export declare const CONTROLLER_REG: RegExp;
export declare const RESTCONTROLLER = "@@RESTCONTROLLER";
export declare const RESTCONTROLLER_REG: RegExp;
export declare const SERVICE = "@@SERVICE";
export declare const SERVICE_REG: RegExp;
export declare const MODEL = "@@MODEL";
export declare const MODEL_REG: RegExp;
export declare const AUTOWIRED = "@@AUTOWIRED";
export declare const AUTOWIRED_REG: RegExp;
export declare const MIDDLEWARE = "@@MIDDLEWARE";
export declare const MIDDLEWARE_REG: RegExp;
export declare type RestfulMethodType = 'get' | 'post' | 'put' | 'patch' | 'delete';
export declare const CLASS_KEY_CONSTRUCTOR = "koatty:class_key_constructor";
export declare const FUNCTION_INJECT_KEY = "koatty:function_inject_key";
export declare const COMPONENT_KEY = "component";
export declare const CONTROLLER_KEY = "controller";
export declare const PRIORITY_KEY = "priority";
export declare const CONFIG_KEY = "config";
export declare const LOGGER_KEY = "logger";