import { Express } from 'express';
import { imagesController } from './controller';

export default class StaticRoute {
	constructor(app: Express) {
		app.route('/photos/static')
			.get(imagesController.indexStatic);
		
		app.route('/photos/api/next')
			.get(imagesController.next);
			
		app.route('/photos/api/image/:id')
			.get(imagesController.image);
	}
}