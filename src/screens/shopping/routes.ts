import { Express } from 'express';
import ShoppingController from './controller.js';

export interface ShoppingConfig {
    username: string;
    password: string;
}

export default function setup(app: Express, config: ShoppingConfig) {
	const controller = new ShoppingController(config);
	
	app.route('/shopping')
		.get(controller.index.bind(controller));
}