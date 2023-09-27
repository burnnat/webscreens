import { Router } from 'express';
import ShoppingController from './controller.js';

export interface ShoppingConfig {
	username: string;
	password: string;
}

export default function setup(router: Router, config: ShoppingConfig) {
	const controller = new ShoppingController(config);
	
	router.route('/')
		.get(controller.index.bind(controller));
}