import { resolve, join } from 'node:path';
import * as fs from 'node:fs';

const examplesDir = join(process.cwd(), 'examples')
if (!fs.existsSync(examplesDir)) {
  throw new Error(`${examplesDir} directory not found`)
}

const examplesDirStat = fs.lstatSync(examplesDir)
if (!examplesDirStat.isDirectory()) {
  throw new Error(`${examplesDir} is not a directory`)
}

export const app = {
  getPath: (folder: string) => resolve(examplesDir, folder),
}
