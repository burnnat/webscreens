import * as bodyParser from 'body-parser';
import config from './config';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as mustacheExpress from 'mustache-express';
import * as logger from 'morgan';
import * as path from 'path';

export default function() {
    var app: express.Express = express();

    app.engine('html', mustacheExpress());

    app.set('view engine', 'html');
    app.set('views', path.resolve(__dirname, '../../views'));

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.resolve(__dirname, '../../public')));

    console.log('Loading routes...');

    for (let route of config.globFiles(config.routes)) {
        const location = path.resolve(route);
        console.log(`Loading routes from: ${location}`);
        require(location).default(app);
    }

    app.use((req: express.Request, res: express.Response, next: Function): void => {
        let err: Error = new Error(`Not found: ${req.path}`);
        next(err);
    });

    return app;
};