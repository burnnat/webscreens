import { Express } from 'express';
import { shoppingController } from '../controllers/shopping.server.controller';

export default class ShoppingRoute {
	constructor(app: Express) {
		app.route('/shopping')
			.get(shoppingController.index);
	}
}