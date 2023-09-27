import { Router } from 'express';
import TvController from './controller.js';

export interface TvConfig {
    timezone: string;
    hostname: string;
}

export default function setup(router: Router, config: TvConfig) {
	const controller = new TvController(config);
	
	router.route('/')
		.get(controller.index.bind(controller));
}