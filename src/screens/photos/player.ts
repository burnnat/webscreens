import path from 'path';
import gaze from 'gaze';
import { sync } from 'glob';
import shuffle from 'lodash/shuffle.js';
import { nanoid } from 'nanoid';

function randomIndex(length: number) {
    return Math.floor(Math.random() * length);
}

export interface PhotosPlayerOptions {
    directory: string;
    exclude?: string[];
}

export class PhotosPlayer {

    private excluded: string[];
    private fileToId: Record<string, string>;
    private idToFile: Record<string, string>;
    private playlist: string[];
    private previous: string | null;
    private index: number;

    public constructor(data: PhotosPlayerOptions) {
        const source = path.resolve(data.directory);

        console.log(`Loading slideshow from directory: ${source}`);

        const filepattern = path.join(source, '**/*.jpg');

        this.excluded = (
            data.exclude
                ? data
                    .exclude
                    .map(dir => {
                        const resolved = path.resolve(dir);
                        console.log(`Excluding files from directory: ${resolved}`)
                        return resolved;
                    })
                : []
        );

        this.fileToId = {};
        this.idToFile = {};

        sync(filepattern, { nocase: true }).forEach((filename) => {
            if (this.isExcluded(filename)) {
                return;
            }

            const id = nanoid();

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

    private isExcluded(target: string): boolean {
        return this.excluded.some((exclude) => {
            const relative = path.relative(exclude, target);
            return !!relative && relative.split(path.sep)[0] != '..' && !path.isAbsolute(relative);
        })
    }

    private handleAdd(filepath) {
        if (this.isExcluded(filepath)) {
            return;
        }

        console.log(`File added: ${filepath}`);
        const id = nanoid();

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

    public nextImage(): string {
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

    public currentImage() {
        return this.playlist[this.index];
    }

    public previousImage() {
        const prevIndex = this.index - 1;

        if (prevIndex < 0) {
            return this.previous;
        }
        else {
            return this.playlist[prevIndex];
        }
    }

    public getFile(id: string) {
        return this.idToFile[id];
    }
}