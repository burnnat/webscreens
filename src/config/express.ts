import bodyParser from 'body-parser';
import config from './config.js';
import cookieParser from 'cookie-parser';
import express from 'express';
import logger from 'morgan';
import mustacheExpress from 'mustache-express';
import path from 'path';

export default async function() {
    var app: express.Express = express();

    app.engine('html', mustacheExpress());

    app.set('view engine', 'html');
    app.set('views', config.views);

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(config.resources));

    console.log('Loading routes...');

    for (let route of config.globFiles(config.routes)) {
        const location = path.resolve(route);
        const screen = path.basename(path.dirname(location));
        console.log(`Loading routes for screen '${screen}' from: ${location}`);
        const module = await import(location);
        module.default(app, config.configForScreen(screen));
    }

    app.use((req: express.Request, res: express.Response, next: Function): void => {
        let err: Error = new Error(`Not found: ${req.path}`);
        next(err);
    });

    return app;
};