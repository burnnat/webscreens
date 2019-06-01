import * as path from 'path';
import { Request, Response } from 'express';
import * as gaze from 'gaze';
import { sync } from 'glob';
import * as sharp from 'sharp';
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

// TODO (#2): create a playlist per connection/session, to guarantee
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

function nextImage(): string {
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

    return id;
}

export default class ImagesController {
    public next(req: Request, res: Response): void {
        res.json({ value: nextImage() });
    }

    public async image(req: Request, res: Response): Promise<void> {
        const id = req.params.id;
        const file = idToFile[id];

        try {
            const buffer = await sharp(file)
                .rotate()
                .jpeg()
                .toBuffer();

            res.contentType('image/jpeg');
            res.send(buffer);
        }
        catch (error) {
            console.error(`An error occurred when rotating the file '${id}': ${error}`);

            // If we can't rotate for some reason just send the file as-is.
            res.sendFile(file);
        }
    }

    public async indexStatic(req: Request, res: Response): Promise<void> {
        const width = parseInt(req.query.width, 10);
        const height = parseInt(req.query.height, 10);

        const id = nextImage();
        const file = idToFile[id];

        try {
            const img = await sharp(file)
                .rotate()
                .resize({
                    width,
                    height,
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .raw()
                .toBuffer({
                    resolveWithObject: true
                });

            const composite = await sharp({
                    create: {
                        width,
                        height,
                        channels: 3,
                        background: '#111'
                    }
                })
                .composite([
                    {
                        input: img.data,
                        raw: img.info
                    }
                ])
                .jpeg()
                .toBuffer();
            
            res.contentType('image/jpeg');
            res.send(composite);
        }
        catch (error) {
            console.error(`An error occurred when resizing the file '${id}': ${error}`);

            // If we can't rotate/resize for some reason just send the file as-is.
            res.sendFile(file);
        }
    }
}

export const imagesController = new ImagesController();