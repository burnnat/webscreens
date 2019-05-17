import * as path from 'path';
import { Request, Response } from 'express';
import config from '../config/config';

export default class IndexController {
    public msg(req: Request, res: Response): void {
        res.json({ msg: 'Hello!' });
    }

    public image(req: Request, res: Response): void {
        res.sendFile(path.join(config.slides, 'dawndeparture.jpg'));
    }
}

export const indexController = new IndexController();