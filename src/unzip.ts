import yauzl from 'yauzl';
import * as fs from 'fs';
import * as path from 'path';

export async function unzip(filePath: string, outputDir: string): Promise<void> {
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
            zipfile.on("close", function() {
                resolve();
            });
            zipfile.on("error", function(err) {
                return reject(err);
            });
        });
    });
}
