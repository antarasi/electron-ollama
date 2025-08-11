import { extract } from 'tar'
import stream from 'node:stream/promises'
import { Readable } from 'stream'

export async function untgzStream(tgzStream: Readable, outputDir: string): Promise<void> {
  return await stream.finished(
    tgzStream.pipe(extract({
      cwd: outputDir,
    })
  ))
}
