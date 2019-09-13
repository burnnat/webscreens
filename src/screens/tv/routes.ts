import { Express } from 'express';
import TvController from './controller';

export interface TvConfig {
    timezone: string;
    hostname: string;
}

export default function setup(app: Express, config: TvConfig) {
	const controller = new TvController(config);
	
	app.route('/tv')
		.get(controller.index.bind(controller));
}