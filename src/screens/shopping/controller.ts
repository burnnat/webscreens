import { Request, Response } from 'express';
import * as OurGroceriesClient from 'our-groceries-client';
import { ShoppingConfig } from './routes';

function customPromisify(object, key) {
    const method = object[key];

    object[key] = function() {
        const args = Array.prototype.slice.call(arguments);

        return new Promise((resolve, reject) => {
            // Add custom callback handler
            args.push((result) => {
                if (result.success) {
                    resolve(result.response);
                }
                else {
                    reject(result.error);
                }
            });

            method.apply(this, args);
        });
    };
}

function createClient() {
    const client = new OurGroceriesClient();

    customPromisify(client, 'authenticate');
    customPromisify(client, 'getLists');
    customPromisify(client, 'getList');

    return client;
}

export default class ShoppingController {

    private username: string;
    private password: string;

    public constructor(data: ShoppingConfig) {
        this.username = data.username;
        this.password = data.password;
    }

    public async index(req: Request, res: Response): Promise<void> {
        const listName = req.query.list;
        const client = createClient();
        
        await client.authenticate(this.username, this.password);
        const lists = await client.getLists();

        const details = await Promise.all(
            lists.shoppingLists
                .filter((list) => list.activeCount > 0)
                .map(async (list) => await client.getList(list.id))
        );

        const model = details.map((detail: any) => {
            const list = detail.list;

            return {
                name: list.name,
                items: (
                    list.items
                        .filter((item) => !item.crossedOff)
                        .map((item) => item.value)
                        .sort()
                )
            };
        });

        res.render(
            'shopping.html',
            { lists: model }
        );
    }
}