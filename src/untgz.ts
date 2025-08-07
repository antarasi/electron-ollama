import { extract } from 'tar'
import { finished } from 'node:stream/promises'
import * as fs from 'fs'

export async function untgz(filePath: string, outputDir: string): Promise<void> {
    return await finished(
      fs.createReadStream(filePath).pipe(extract({
        cwd: outputDir,
    })))
}
