import { Express } from 'express';
import PhotosController from './controller.js';

export interface PhotosConfig {
	directory: string;
	exclude?: string[];
	stampSize: number;
}

export default function setup(app: Express, config: PhotosConfig) {
	const controller = new PhotosController(config);

	app.route('/photos/static')
		.get(controller.indexStatic.bind(controller));

	app.route('/photos/static/previous')
		.get(controller.previousStatic.bind(controller));
	
	app.route('/photos/api/next')
		.get(controller.next.bind(controller));
		
	app.route('/photos/api/image/:id')
		.get(controller.image.bind(controller));
}
