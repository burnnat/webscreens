import { Express } from 'express';
import LovelaceController from './controller';

export interface LovelaceConfig {
	url: string;
	timezone: string;
	screenshotDelay: number;
}

export default function setup(app: Express, config: LovelaceConfig) {
	const controller = new LovelaceController(config);

	app.route('/lovelace')
		.get(controller.index.bind(controller));
}
