import { Express } from 'express';
import { imagesController } from '../controllers/images.server.controller';

export default class StaticRoute {
	constructor(app: Express) {
		app.route('/static')
			.get(imagesController.indexStatic);
		
		app.route('/api/next')
			.get(imagesController.next);
			
		app.route('/api/image/:id')
			.get(imagesController.image);
	}
}