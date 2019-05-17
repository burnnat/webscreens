import { Express } from 'express';
import { indexController } from '../controllers/index.server.controller';

export default class IndexRoute {
	constructor(app: Express) {
		app.route('/api/next')
			.get(indexController.next);
			
		app.route('/api/image/:id')
			.get(indexController.image);
	}
}