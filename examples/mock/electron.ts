import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const app = {
  getPath: (folder: string) => resolve(__dirname, '..', folder),
}
