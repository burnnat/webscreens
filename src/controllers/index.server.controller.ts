import * as path from 'path';
import { Request, Response } from 'express';
import { sync } from 'glob';
import { shuffle } from 'lodash';

import config from '../config/config';

const filenames = sync(path.join(config.slides, '**/*.jpg'));

let playlist = shuffle(filenames);
let index = 0;

export default class IndexController {
    public next(req: Request, res: Response): void {
        index = index + 1;
        
        if (index >= playlist.length) {
            const previous = playlist[index - 1];

            playlist = shuffle(filenames);
            index = 0;

            // When looping, ensure that the first item in the next playlist is not
            // the same as the last item in the previous playlist (otherwise the same
            // item would appear twice in a row).
            if (playlist[0] === previous) {
                const replacement = Math.floor(Math.random() * (playlist.length - 1)) + 1;
                playlist[0] = playlist[replacement];
                playlist[replacement] = previous;
            }
        }

        res.json({ value: index });
    }

    public image(req: Request, res: Response): void {
        res.sendFile(playlist[req.params.id]);
    }
}

export const indexController = new IndexController();