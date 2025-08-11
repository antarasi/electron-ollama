import yauzl from 'yauzl';
import * as fs from 'fs';
import * as path from 'path';

export async function unzipFile(filePath: string, outputDir: string, deleteZip: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
        yauzl.open(filePath, {lazyEntries: true}, function(err, zipfile) {
            if (err) {
                return reject(err);
            }
            zipfile.readEntry();
            zipfile.on("entry", function(entry) {
                if (entry.fileName.endsWith('/')) {
                    // Directory file names end with '/'.
                    // Note that entries for directories themselves are optional.
                    // An entry's fileName implicitly requires its parent directories to exist.
                    zipfile.readEntry();
                } else {
                    // file entry
                    zipfile.openReadStream(entry, function(err, readStream) {
                    if (err) {
                        return reject(err);
                    }
                    readStream.on("end", function() {
                        zipfile.readEntry();
                    });
                    readStream.pipe(fs.createWriteStream(path.join(outputDir, entry.fileName)));
                  });
                }
            });
            zipfile.on("close", async function() {
              if (deleteZip) {
                await fs.promises.unlink(filePath).catch(() => {}); // delete zip file after extraction, no harm if it fails
              }
              resolve();
            });
            zipfile.on("error", function(err) {
                return reject(err);
            });
        });
    });
}
