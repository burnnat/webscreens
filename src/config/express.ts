import * as bodyParser from 'body-parser';
import config from './config';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as logger from 'morgan';
import * as path from 'path';

export default function () {
    var app: express.Express = express();

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, '../../src/public')));

    for (let route of config.globFiles(config.routes)) {
        require(path.resolve(route)).default(app);
    }

    app.use((req: express.Request, res: express.Response, next: Function): void => {
        let err: Error = new Error('Not Found');
        next(err);
    });

    return app;
};