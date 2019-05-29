import * as path from 'path';
import { Request, Response } from 'express';
import * as gaze from 'gaze';
import { sync } from 'glob';
import * as jo from 'jpeg-autorotate';
import { keys, shuffle, transform } from 'lodash';
import { generate } from 'shortid';

import config from '../config/config';

const source = path.resolve(config.slides);

console.log(`Loading slideshow from directory: ${source}`);

const filepattern = path.join(source, '**/*.jpg');

const fileToId = {};
const idToFile = {};

sync(filepattern, { nocase: true }).forEach((filename) => {
    const id = generate();

    fileToId[filename] = id;
    idToFile[id] = filename;
});

function randomIndex(length: number) {
    return Math.floor(Math.random() * length);
}

// TODO: create a playlist per connection/session, to guarantee
// good independent shuffling for multiple clients.
let playlist: string[] = shuffle(fileToId);
let index = 0;

gaze(
    path.relative(process.cwd(), filepattern),
    (err, watcher) => {
        watcher.on('added', (filepath) => {
            console.log(`File added: ${filepath}`);
            const id = generate();

            fileToId[filepath] = id;
            idToFile[id] = filepath;

            let location = randomIndex(playlist.length + 1);
            playlist.splice(location, 0, id);

            if (location < index) {
                index = index + 1;
            }
        });

        watcher.on('deleted', (filepath) => {
            console.log(`File deleted: ${filepath}`);
            const id = fileToId[filepath];

            delete fileToId[filepath];
            delete idToFile[id];
            
            let location = playlist.indexOf(id);
            playlist.splice(location, 1);

            if (location < index) {
                index = index - 1;
            }
        });
    }
);

export default class IndexController {
    public next(req: Request, res: Response): void {
        index = index + 1;
        
        if (index >= playlist.length) {
            console.log(`End of playlist reached. Reshuffling...`);
            const previous = playlist[index - 1];

            playlist = shuffle(fileToId);
            index = 0;

            // When looping, ensure that the first item in the next playlist is not
            // the same as the last item in the previous playlist (otherwise the same
            // item would appear twice in a row).
            if (playlist[0] === previous) {
                const replacement = randomIndex(playlist.length - 1) + 1;
                playlist[0] = playlist[replacement];
                playlist[replacement] = previous;
            }
        }

        const id = playlist[index];
        const file = idToFile[id];

        console.log(`Next image: ${id} (${file})`);                                                                                                                                                    
        res.json({ value: id });
    }

    public image(req: Request, res: Response): void {
        const id = req.params.id;
        const file = idToFile[id];
        
        jo.rotate(
            file,
            {},
            (error, buffer, orientation, dimensions, quality) => {
                if (error) {
                    if (error.code !== jo.errors.correct_orientation && error.code !== jo.errors.no_orientation) {
                        console.error(`An error occurred when rotating the file '${id}': ${error.message}`);
                    }

                    // If we can't rotate for some reason (maybe the file is already rotated), just send as-is.
                    res.sendFile(file);
                }
                else {
                    res.contentType('image/jpeg');
                    res.send(buffer);
                }
            }
        );
    }
}

export const indexController = new IndexController();