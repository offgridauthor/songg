import { readdirSync, statSync } from 'fs';
import path from 'path';

const dirs = readdirSync('./Songs');

let filtered = dirs.filter(entry => {
  return path.extname(entry).toLowerCase() === '.json'
});

export default filtered;
