import { Express } from 'express';
import { indexController } from '../controllers/index.server.controller';

export default class IndexRoute {
	constructor(app: Express) {
		app.route('/api/msg')
			.get(indexController.msg);
			
		app.route('/api/image')
			.get(indexController.image);
	}
}