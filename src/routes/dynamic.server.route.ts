import { Express } from 'express';
import { imagesController } from '../controllers/images.server.controller';

export default class DynamicRoute {
	constructor(app: Express) {
		app.route('/api/next')
			.get(imagesController.next);
			
		app.route('/api/image/:id')
			.get(imagesController.image);
	}
}