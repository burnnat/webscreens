import * as path from 'path';
import { Request, Response } from 'express';
import * as gaze from 'gaze';
import { sync } from 'glob';
import * as sharp from 'sharp';
import { keys, shuffle, transform } from 'lodash';
import { generate } from 'shortid';
import * as TextToSVG from 'text-to-svg';
import { ExifImage } from 'exif';
import * as moment from 'moment-timezone';
import { PhotosConfig } from './routes';

function randomIndex(length: number) {
    return Math.floor(Math.random() * length);
}

function getExif(image): Promise<any> {
    return new Promise(function(resolve, reject) {
        new ExifImage(image, function(error, data) {
            if (error !== null) {
                reject(error);
            }
            else {
                resolve(data);
            }
        });
    });
}

async function getImageDate(image) {
    const metadata = await getExif(image);
    const date = metadata.exif.DateTimeOriginal;

    if (date != null) {
        return moment(date, 'YYYY:MM:DD HH:mm:ss').format('MM/DD/YYYY');
    }
    else {
        return null;
    }
}

interface StringMap {
    [key: string]: string;
}

export default class PhotosController {

    private fileToId: StringMap;
    private idToFile: StringMap;
    private playlist: string[];
    private previous: string;
    private index: number;
    private stampSize: number;

    public constructor(data: PhotosConfig) {
        this.stampSize = data.stampSize || 16;

        const source = path.resolve(data.directory);

        console.log(`Loading slideshow from directory: ${source}`);

        const filepattern = path.join(source, '**/*.jpg');

        this.fileToId = {};
        this.idToFile = {};

        sync(filepattern, { nocase: true }).forEach((filename) => {
            const id = generate();

            this.fileToId[filename] = id;
            this.idToFile[id] = filename;
        });

        // TODO (#2): create a playlist per connection/session, to guarantee
        // good independent shuffling for multiple clients.
        this.playlist = shuffle(this.fileToId);
        this.previous = null;
        this.index = 0;

        gaze(
            path.relative(process.cwd(), filepattern),
            (err, watcher) => {
                watcher.on('added', (filepath) => this.handleAdd(filepath));
                watcher.on('deleted', (filepath) => this.handleDelete(filepath));
            }
        );

    }

    private handleAdd(filepath) {
        console.log(`File added: ${filepath}`);
        const id = generate();

        this.fileToId[filepath] = id;
        this.idToFile[id] = filepath;

        let location = randomIndex(this.playlist.length + 1);
        this.playlist.splice(location, 0, id);

        if (location < this.index) {
            this.index = this.index + 1;
        }
    }

    private handleDelete(filepath) {
        console.log(`File deleted: ${filepath}`);
        const id = this.fileToId[filepath];

        delete this.fileToId[filepath];
        delete this.idToFile[id];
        
        let location = this.playlist.indexOf(id);
        this.playlist.splice(location, 1);

        if (location < this.index) {
            this.index = this.index - 1;
        }
    }

    private nextImage(): string {
        this.index = this.index + 1;
        
        if (this.index >= this.playlist.length) {
            console.log(`End of playlist reached. Reshuffling...`);
            this.previous = this.playlist[this.index - 1];
    
            this.playlist = shuffle(this.fileToId);
            this.index = 0;
    
            // When looping, ensure that the first item in the next playlist is not
            // the same as the last item in the previous playlist (otherwise the same
            // item would appear twice in a row).
            if (this.playlist[0] === this.previous) {
                const replacement = randomIndex(this.playlist.length - 1) + 1;
                this.playlist[0] = this.playlist[replacement];
                this.playlist[replacement] = this.previous;
            }
        }
    
        const id = this.playlist[this.index];
        const file = this.idToFile[id];
    
        console.log(`Next image: ${id} (${file})`);
    
        return id;
    }

    private previousImage() {
        const prevIndex = this.index - 1;

        if (prevIndex < 0) {
            return this.previous;
        }
        else {
            return this.playlist[prevIndex];
        }
    }

    public next(req: Request, res: Response): void {
        res.json({ value: this.nextImage() });
    }

    public async image(req: Request, res: Response): Promise<void> {
        const id = req.params.id;
        const file = this.idToFile[id];

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

    public indexStatic(req: Request, res: Response) {
        const width = parseInt(req.query.width, 10);
        const height = parseInt(req.query.height, 10);

        const id = this.nextImage();

        this.sendScaled(id, width, height, res);
    }

    public previousStatic(req: Request, res: Response) {
        const width = parseInt(req.query.width, 10);
        const height = parseInt(req.query.height, 10);

        const id = this.previousImage();

        this.sendScaled(id, width, height, res);
    }

    private async sendScaled(id: string, width: number, height: number, res: Response): Promise<void>  {
        const file = this.idToFile[id];

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

            const overlays: object[] = [
                {
                    input: img.data,
                    raw: img.info
                }
            ];

            const date = await getImageDate(file);

            if (date != null) {
                const textToSVG = TextToSVG.loadSync();
                const textOptions = {
                    x: 0,
                    y: 0,
                    fontSize: this.stampSize,
                    anchor: 'top',
                    attributes: {
                        fill: 'white'
                    }
                };
                
                const svg = Buffer.from(textToSVG.getSVG(date, textOptions));
                const svgSize = textToSVG.getMetrics(date, textOptions);

                overlays.push({
                    input: {
                        create: {
                            width: svgSize.width,
                            height: svgSize.height,
                            channels: 4,
                            background: '#111A'
                        }
                    },
                    gravity: 'southwest'
                });

                overlays.push({
                    input: svg,
                    gravity: 'southwest'
                });
            }

            const composite = await sharp({
                    create: {
                        width,
                        height,
                        channels: 3,
                        background: '#111'
                    }
                })
                .composite(overlays)
                .jpeg()
                .toBuffer();
            
            res.contentType('image/jpeg');
            res.send(composite);
        }
        catch (error) {
            console.error(`An error occurred when resizing the file '${id}':`, error);

            // If we can't rotate/resize for some reason just send the file as-is.
            res.sendFile(file);
        }
    }
}