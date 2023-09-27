import { Router } from 'express';
import LovelaceController from './controller.js';

export interface LovelaceConfig {
	url: string;
	timezone: string;
	screenshotDelay: number;
}

export default function setup(router: Router, config: LovelaceConfig) {
	const controller = new LovelaceController(config);

	router.route('/')
		.get(controller.index.bind(controller));
}
