import * as path from 'path';
import { Request, Response } from 'express';
import config from '../config/config';

const filenames = [
    'dawndeparture.jpg',
    'milan_cathedral.jpg',
    'walle_waving.jpg'
];

let index = 0;

export default class IndexController {
    public next(req: Request, res: Response): void {
        index = (index + 1) % filenames.length;
        res.json({ value: index });
    }

    public image(req: Request, res: Response): void {
        res.sendFile(path.join(config.slides, filenames[req.params.id]));
    }
}

export const indexController = new IndexController();