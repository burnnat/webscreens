import { Request, Response } from 'express';
import sharp from 'sharp';
import TextToSVG from 'text-to-svg';
import exif from 'exif';
import moment from 'moment-timezone';
import { PhotosPlayer } from './player.js';

function getExif(image): Promise<any> {
    return new Promise(function(resolve, reject) {
        new exif.ExifImage(image, function(error, data) {
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

export interface PhotosControllerOptions {
    stampSize: number;
}

export class PhotosController {

    private stampSize: number;
    private player: PhotosPlayer;

    public constructor(player: PhotosPlayer, data: PhotosControllerOptions) {
        this.player = player;
        this.stampSize = data.stampSize || 16;
    }

    public next(req: Request, res: Response): void {
        res.json({ value: this.player.nextImage() });
    }

    public async image(req: Request, res: Response): Promise<void> {
        const id = req.params.id;
        const file = this.player.getFile(id);

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
        const width = parseInt(req.query.width as string, 10);
        const height = parseInt(req.query.height as string, 10);

        // Only actual GET requests should advance the image, others
        // like HEAD requests will simply return the current image.
        const id = (
            req.method === 'GET'
                ? this.player.nextImage()
                : this.player.currentImage()
        );

        this.sendScaled(id, width, height, res);
    }

    public previousStatic(req: Request, res: Response) {
        const width = parseInt(req.query.width as string, 10);
        const height = parseInt(req.query.height as string, 10);

        const id = this.player.previousImage();
        
        if (id != null) {
            this.sendScaled(id, width, height, res);
        }
        else {
            res.status(404).send('No previous image exists.');
        }
    }

    private async sendScaled(id: string, width: number, height: number, res: Response): Promise<void>  {
        const file = this.player.getFile(id);

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