import { ExpressAdapter } from 'ask-sdk-express-adapter';
import { Router } from 'express';
import { handler } from './alexa.js';
import PhotosController from './controller.js';

export interface PhotosConfig {
	directory: string;
	exclude?: string[];
	stampSize: number;
}

export default function setup(router: Router, config: PhotosConfig) {
	const controller = new PhotosController(config);

	router.route('/static')
		.get(controller.indexStatic.bind(controller));

	router.route('/static/previous')
		.get(controller.previousStatic.bind(controller));
	
	router.route('/api/next')
		.get(controller.next.bind(controller));
		
	router.route('/api/image/:id')
		.get(controller.image.bind(controller));
	
	router.route('/api/alexa')
		.post(...new ExpressAdapter(handler, true, true).getRequestHandlers());
}
