import { Request, Response } from 'express';

export default class ShoppingController {
    public index(req: Request, res: Response): void {
        res.render(
            'shopping.html',
            {
                content: "hello world"
            }
        );
    }
}

export const shoppingController = new ShoppingController();