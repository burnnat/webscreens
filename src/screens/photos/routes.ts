import { ExpressAdapter } from 'ask-sdk-express-adapter';
import { Router } from 'express';
import { createSkill, PhotosSkillOptions } from './alexa.js';
import { PhotosController, PhotosControllerOptions } from './controller.js';
import { PhotosPlayer, PhotosPlayerOptions } from './player.js';

export type PhotosConfig = (
	PhotosPlayerOptions &
	PhotosControllerOptions &
	PhotosSkillOptions
);

export default function setup(router: Router, config: PhotosConfig) {
	const player = new PhotosPlayer(config);
	const controller = new PhotosController(player, config);
	const skill = createSkill(player, config);

	router.route('/static')
		.get(controller.indexStatic.bind(controller));

	router.route('/static/previous')
		.get(controller.previousStatic.bind(controller));
	
	router.route('/api/next')
		.get(controller.next.bind(controller));
		
	router.route('/api/image/:id')
		.get(controller.image.bind(controller));
	
	router.route('/api/alexa')
		.post(...new ExpressAdapter(skill, true, true).getRequestHandlers());
}
