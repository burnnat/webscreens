import { Request, Response } from 'express';

export default class IndexController {
    public msg(req: Request, res: Response): void {
        res.json({ msg: 'Hello!' });
    }
}

export const indexController = new IndexController();