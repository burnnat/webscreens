import path from 'path';
import fs from 'fs-extra';
import { glob } from 'glob';

// Copy static resources
fs.ensureDirSync('dist/public');
fs.copySync('src/public', 'dist/public');
glob.sync('src/screens/*/public/').forEach((dir) => {
    const dest = path.join('dist/public', path.basename(path.dirname(dir)));
    fs.ensureDirSync(dest);
    fs.copySync(dir, dest);
});

// Copy JS dependencies
fs.ensureDirSync('dist/public');
fs.copySync('node_modules/moveto/dist/moveTo.min.js', 'dist/public/deps/moveTo.min.js');

// Copy views
fs.ensureDirSync('dist/views');
glob.sync('src/screens/*/views/*').forEach((file) => {
    fs.copySync(file, path.join('dist/views', path.basename(file)));
});