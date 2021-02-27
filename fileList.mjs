import { readdirSync } from 'fs';
import path from 'path';

const dirs = readdirSync('./Songs');

let filtered = dirs.filter(entry => {
    return path.extname(entry).toLowerCase() === '.json'
});

export const links = filtered.map((nm) => `<a title="generate a song from file ${nm}" href="/songSystem?fileName=${nm}">Generate "${nm}"</a>`)

export default filtered;
