import { sync } from 'glob';
import { union } from 'lodash';
import * as yargs from 'yargs'
import { Argv } from 'yargs';

let argv =  yargs
	.option('p', {
		alias: 'port',
		default: 3000,
		describe: 'Port to bind on',
		type: 'number'
	})
	.option('d', {
		alias: 'directory',
		default: '.',
		describe: 'Directory of slideshow images',
		type: 'string'
	})
	.help()
	.argv;

export default class Config {
	public static port: number = argv.p;
	public static slides: string = argv.d;
	public static routes: string = './dist/routes/**/*.js';
	public static models: string = './dist/models/**/*.js';
	public static globFiles(location: string): string[] {
		return union([], sync(location));
	}
}