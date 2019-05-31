import * as path from 'path';
import { Request, Response } from 'express';
import * as gaze from 'gaze';
import { sync } from 'glob';
import * as imageSize from 'image-size';
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

function center(viewportSize, imageSize) {
    var position = Math.max(
        Math.min(
            Math.floor((viewportSize - imageSize) / 2),
            viewportSize
        ),
        0
    );

    return position + 'px';
}

export default class ImagesController {
    public next(req: Request, res: Response): void {
        res.json({ value: nextImage() });
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

    public indexStatic(req: Request, res: Response): void {
        const viewWidth = parseInt(req.param('width'), 10);
        const viewHeight = parseInt(req.param('height'), 10);

        const id = nextImage();
        const file = idToFile[id];

        jo.rotate(
            file,
            { quality: 85 },
            (error, buffer, orientation, rotatedDimensions, quality) => {
                let dimensions;

                if (error) {
                    dimensions = imageSize(file)
                }
                else {
                    dimensions = rotatedDimensions;
                }

                let imgWidth = dimensions.width;
                let imgHeight = dimensions.height;
                
                let width = 'auto';
                let height = 'auto';
                let left = '0';
                let top = '0';

                if (imgWidth < viewWidth && imgHeight < viewHeight) {
                    // No scaling needed, just center.
                    left = center(viewWidth, imgWidth);
                    top = center(viewHeight, imgHeight);
                }
                else {
                    var horizScale = imgWidth / viewWidth;
                    var vertScale = imgHeight / viewHeight;

                    if (horizScale > vertScale) {
                        // Scale horizontally to fit.
                        width = viewWidth + 'px';
                        top = center(viewHeight, imgHeight / horizScale);
                    }
                    else {
                        // Scale vertically to fit.
                        height = viewHeight + 'px';
                        left = center(viewWidth, imgWidth / vertScale);
                    }
                }

                res.render(
                    'static.html',
                    {
                        width,
                        height,
                        left,
                        top,
                        image: id
                    }
                );
            }
        );
    }
}

export const imagesController = new ImagesController();