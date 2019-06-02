import * as path from 'path';
import { sync } from 'glob';
import { union } from 'lodash';
import * as yargs from 'yargs'

let argv =  yargs
	.config()
	.option('b', {
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
	.option('u', {
		alias: 'username',
		describe: 'OurGroceries username',
		type: 'string'
	})
	.option('p', {
		alias: 'password',
		describe: 'OurGroceries password',
		type: 'string'
	})
	.help()
	.argv;

export default class Config {
	public static port: number = argv.b;
	public static slides: string = argv.d;
	public static username: string = argv.u;
	public static password: string = argv.p;
	public static routes: string = path.join(__dirname, '../routes/**/*.js');
	public static globFiles(location: string): string[] {
		return union([], sync(location));
	}
}