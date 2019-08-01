import { Express } from 'express';
import { shoppingController } from './controller';

export default class ShoppingRoute {
	constructor(app: Express) {
		app.route('/shopping')
			.get(shoppingController.index);
	}
}