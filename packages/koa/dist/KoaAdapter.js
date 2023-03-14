"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KoaAdapter = void 0;
const koa_1 = __importDefault(require("koa"));
const koa_mount_1 = __importDefault(require("koa-mount"));
const koa_router_1 = __importDefault(require("koa-router"));
const koa_static_1 = __importDefault(require("koa-static"));
const koa_views_1 = __importDefault(require("koa-views"));
const path_1 = __importDefault(require("path"));
class KoaAdapter {
    constructor() {
        this.basePath = '';
        this.uiConfig = {};
    }
    setBasePath(path) {
        this.basePath = path;
        return this;
    }
    setStaticPath(staticsRoute, staticsPath) {
        this.statics = { route: staticsRoute, path: staticsPath };
        return this;
    }
    setViewsPath(viewPath) {
        this.viewPath = viewPath;
        return this;
    }
    setErrorHandler(handler) {
        this.errorHandler = handler;
        return this;
    }
    setApiRoutes(routes) {
        this.apiRoutes = routes;
        return this;
    }
    setEntryRoute(routeDef) {
        this.entryRoute = routeDef;
        return this;
    }
    setQueues(bullBoardQueues) {
        this.bullBoardQueues = bullBoardQueues;
        return this;
    }
    setUIConfig(config = {}) {
        this.uiConfig = config;
        return this;
    }
    registerPlugin(options = { mount: this.basePath }) {
        if (!this.statics) {
            throw new Error(`Please call 'setStaticPath' before using 'registerPlugin'`);
        }
        else if (!this.entryRoute) {
            throw new Error(`Please call 'setEntryRoute' before using 'registerPlugin'`);
        }
        else if (!this.viewPath) {
            throw new Error(`Please call 'setViewsPath' before using 'registerPlugin'`);
        }
        else if (!this.apiRoutes) {
            throw new Error(`Please call 'setApiRoutes' before using 'registerPlugin'`);
        }
        else if (!this.bullBoardQueues) {
            throw new Error(`Please call 'setQueues' before using 'registerPlugin'`);
        }
        else if (!this.errorHandler) {
            throw new Error(`Please call 'setErrorHandler' before using 'registerPlugin'`);
        }
        if (!options.mount) {
            options.mount = this.basePath;
        }
        const app = new koa_1.default();
        const router = new koa_router_1.default({
            strict: true,
        });
        app.use(async (ctx, next) => {
            try {
                await next();
            }
            catch (err) {
                if (this.errorHandler) {
                    const { status, body } = this.errorHandler(err);
                    ctx.status = status || 500;
                    ctx.body = body;
                    ctx.app.emit('error', err, ctx);
                }
            }
        });
        app.use((0, koa_views_1.default)(this.viewPath, {
            extension: path_1.default.extname(this.entryRoute.handler().name).substring(1),
        }));
        const { method, route, handler } = this.entryRoute;
        const viewRoutes = Array.isArray(route) ? route : [route];
        viewRoutes.forEach((path) => {
            router[method](path, async (ctx) => {
                const { name } = handler();
                const basePath = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;
                const uiConfig = JSON.stringify(this.uiConfig)
                    .replace(/</g, '\\u003c')
                    .replace(/>/g, '\\u003e');
                await ctx.render(name, { basePath, uiConfig });
            });
        });
        app.use((0, koa_mount_1.default)(this.statics.route, (0, koa_static_1.default)(this.statics.path)));
        this.apiRoutes.forEach((route) => {
            const methods = Array.isArray(route.method) ? route.method : [route.method];
            methods.forEach((method) => {
                router[method](route.route, async (ctx) => {
                    const response = await route.handler({
                        queues: this.bullBoardQueues,
                        params: ctx.params,
                        query: ctx.query,
                    });
                    ctx.status = response.status || 200;
                    return (ctx.body = response.body);
                });
            });
        });
        app.use(router.routes()).use(router.allowedMethods());
        return (0, koa_mount_1.default)(options.mount || '/', app);
    }
}
exports.KoaAdapter = KoaAdapter;
//# sourceMappingURL=KoaAdapter.js.map