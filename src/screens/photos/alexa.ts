import { ErrorHandler, HandlerInput, RequestHandler, SkillBuilders } from 'ask-sdk-core';
import { Response, SessionEndedRequest } from 'ask-sdk-model';

const LaunchRequestHandler: RequestHandler = {
	canHandle(handlerInput: HandlerInput): boolean {
		const request = handlerInput.requestEnvelope.request;
		return request.type === 'LaunchRequest';
	},
	handle(handlerInput: HandlerInput): Response {
		const speechText = 'Welcome to your SDK weather skill. Ask me the weather!';

		return handlerInput.responseBuilder
			.speak(speechText)
			.reprompt(speechText)
			.withSimpleCard('Welcome to your SDK weather skill. Ask me the weather!', speechText)
			.getResponse();
	},
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
		const speechText = 'You can ask me the weather!';

		return handlerInput.responseBuilder
			.speak(speechText)
			.reprompt(speechText)
			.withSimpleCard('You can ask me the weather!', speechText)
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
			.withSimpleCard('Goodbye!', speechText)
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

export const handler = (
	SkillBuilders
		.custom()
		.addRequestHandlers(
			LaunchRequestHandler,
			HelloWorldIntentHandler,
			HelpIntentHandler,
			CancelAndStopIntentHandler,
			SessionEndedRequestHandler,
		)
		.addErrorHandlers(ErrorHandler)
		.create()
);