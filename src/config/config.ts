import fs from 'fs';
import { fileURLToPath } from 'url';
import { sync } from 'glob';
import union from 'lodash/union.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

let argv = (
	yargs(hideBin(process.argv))
		.option('b', {
			alias: 'port',
			default: 3000,
			describe: 'Port to bind on',
			type: 'number'
		})
		.option('c', {
			alias: 'config',
			describe: 'Path to config file',
			type: 'string',
			demandOption: true
		})
		.help()
		.argv
);

const relative = (location: string) => fileURLToPath(new URL(location, import.meta.url));

class Config {
	private data: {
		[screen: string]: any;
	};

	public port: number;
	public resources: string;
	public views: string;
	public routes: string;
	
	constructor(data) {
		this.port = argv.b;
		this.data = data;

		this.resources = relative('../public/');
		this.views = relative('../views/');
		this.routes = relative('../screens/*/routes.js');
	}

	globFiles(location: string): string[] {
		return union([], sync(location));
	}

	configForScreen(screen: string) {
		return this.data[screen];
	}
}

const data = JSON.parse(fs.readFileSync(argv.config, 'utf8'));
const instance = new Config(data);

export default instance;