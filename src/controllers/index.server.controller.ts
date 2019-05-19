import * as path from 'path';
import { Request, Response } from 'express';
import * as gaze from 'gaze';
import { sync } from 'glob';
import { keys, shuffle, transform } from 'lodash';
import { generate } from 'shortid';

import config from '../config/config';

const filepattern = path.join(config.slides, '**/*.jpg');

const fileToId = {};
const idToFile = {};

sync(filepattern).forEach((filename) => {
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

        res.json({ value: playlist[index] });
    }

    public image(req: Request, res: Response): void {
        res.sendFile(idToFile[req.params.id]);
    }
}

export const indexController = new IndexController();