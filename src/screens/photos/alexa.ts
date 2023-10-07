import { ErrorHandler, HandlerInput, RequestHandler, SkillBuilders } from 'ask-sdk-core';
import { Directive, Response, SessionEndedRequest } from 'ask-sdk-model';
import { PhotosPlayer } from './player.js';

export interface PhotosSkillOptions {
	baseUrl: string;
}

export function createSkill(player: PhotosPlayer, options: PhotosSkillOptions) {
	const renderSlide = (id: string): Directive => ({
		type: 'Alexa.Presentation.APL.RenderDocument',
		token: 'documentToken',
		document: {
			src: 'doc://alexa/apl/documents/PhotoSlide',
			type: 'Link'
		},
		datasources: {
			imageSource: {
				url: `${options.baseUrl}/photos/api/image/${id}`
			}
		}
	});

	const RenderNextHandler: RequestHandler = {
		canHandle(input) {
			const request = input.requestEnvelope.request;
			return (
				(request.type === 'LaunchRequest') ||
				(request.type === 'IntentRequest' && request.intent.name === 'StartSlideshowIntent') ||
				(request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NextIntent') ||
				(request.type === 'Alexa.Presentation.APL.UserEvent' && request.arguments?.[0] === 'nextSlide')
			);
		},
		handle: (input) => (
			input.responseBuilder
				.addDirective(renderSlide(player.nextImage()))
				.getResponse()
		)
	};

	const RenderPreviousHandler: RequestHandler = {
		canHandle(input) {
			const request = input.requestEnvelope.request;
			return (
				request.type === 'IntentRequest' && request.intent.name === 'AMAZON.PreviousIntent'
			);
		},
		handle: (input) => {
			const previous = player.previousImage();

			if (previous) {
				return (
					input.responseBuilder
						.addDirective(renderSlide(previous))
						.getResponse()
				);
			}
			else {
				return (
					input.responseBuilder
						.speak('Sorry, there is no previous photo.')
						.reprompt('Sorry, there is no previous photo.')
						.getResponse()
				);
			}
		}
	};

	const HelloWorldIntentHandler: RequestHandler = {
		canHandle(handlerInput: HandlerInput): boolean {
			const request = handlerInput.requestEnvelope.request;
			return request.type === 'IntentRequest'
				&& request.intent.name === 'HelloWorldIntent';
		},
		handle(handlerInput: HandlerInput): Response {
			const speechText = 'Hello world!';

			return handlerInput.responseBuilder
				.speak(speechText)
				.withSimpleCard('Hello', speechText)
				.getResponse();
		},
	};

	const HelpIntentHandler: RequestHandler = {
		canHandle(handlerInput: HandlerInput): boolean {
			const request = handlerInput.requestEnvelope.request;
			return request.type === 'IntentRequest'
				&& request.intent.name === 'AMAZON.HelpIntent';
		},
		handle(handlerInput: HandlerInput): Response {
			const speechText = 'You can ask me to show a slideshow!';

			return handlerInput.responseBuilder
				.speak(speechText)
				.reprompt(speechText)
				.withSimpleCard('Help', speechText)
				.getResponse();
		},
	};

	const CancelAndStopIntentHandler: RequestHandler = {
		canHandle(handlerInput: HandlerInput): boolean {
			const request = handlerInput.requestEnvelope.request;
			return request.type === 'IntentRequest'
				&& (request.intent.name === 'AMAZON.CancelIntent'
					|| request.intent.name === 'AMAZON.StopIntent');
		},
		handle(handlerInput: HandlerInput): Response {
			const speechText = 'Goodbye!';

			return handlerInput.responseBuilder
				.speak(speechText)
				.withSimpleCard('Goodbye', speechText)
				.withShouldEndSession(true)
				.getResponse();
		},
	};

	const SessionEndedRequestHandler: RequestHandler = {
		canHandle(handlerInput: HandlerInput): boolean {
			const request = handlerInput.requestEnvelope.request;
			return request.type === 'SessionEndedRequest';
		},
		handle(handlerInput: HandlerInput): Response {
			console.log(`Session ended with reason: ${(handlerInput.requestEnvelope.request as SessionEndedRequest).reason}`);

			return handlerInput.responseBuilder.getResponse();
		},
	};

	const ErrorHandler: ErrorHandler = {
		canHandle(handlerInput: HandlerInput, error: Error): boolean {
			return true;
		},
		handle(handlerInput: HandlerInput, error: Error): Response {
			console.log(`Error handled: ${error.message}`);

			return handlerInput.responseBuilder
				.speak('Sorry, I don\'t understand your command. Please say it again.')
				.reprompt('Sorry, I don\'t understand your command. Please say it again.')
				.getResponse();
		}
	};

	return (
		SkillBuilders
			.custom()
			.addRequestHandlers(
				RenderNextHandler,
				RenderPreviousHandler,
				HelloWorldIntentHandler,
				HelpIntentHandler,
				CancelAndStopIntentHandler,
				SessionEndedRequestHandler,
			)
			.addErrorHandlers(ErrorHandler)
			.create()
	);
}