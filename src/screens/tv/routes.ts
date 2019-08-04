import { Express } from 'express';
import { tvController } from './controller';

export default class TvRoute {
	constructor(app: Express) {
		app.route('/tv')
			.get(tvController.index);
	}
}