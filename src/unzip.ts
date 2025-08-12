import yauzl from 'yauzl';
import * as fs from 'fs';
import * as path from 'path';

function mkdirp(dir: string, cb: () => void) {
  if (dir === ".") return cb();
  fs.stat(dir, function(err) {
    if (err == null) return cb(); // already exists

    const parent = path.dirname(dir);
    mkdirp(parent, function() {
      process.stdout.write(dir.replace(/\/$/, "") + "/\n");
      fs.mkdir(dir, cb);
    });
  });
}

export async function unzipFile(filePath: string, outputDir: string, deleteZip: boolean = true): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, {lazyEntries: true}, function(err, zipfile) {
      if (err) return reject(err);

            // track when we've closed all our file handles
      let handleCount = 0;
      function incrementHandleCount() {
        handleCount++;
      }
      function decrementHandleCount() {
        handleCount--;
        if (handleCount === 0) {
          // all input and output handles closed
          resolve()
        }
      }

      incrementHandleCount();
      zipfile.on("close", async function() {
        if (deleteZip) {
          await fs.promises.unlink(filePath).catch(() => {}); // delete zip file after extraction, no harm if it fails
        }
        decrementHandleCount();
      });

      zipfile.readEntry();

      zipfile.on("entry", function(entry) {
        if (entry.fileName.endsWith('/')) {
          // Directory file names end with '/'.
          // Note that entries for directories themselves are optional.
          // An entry's fileName implicitly requires its parent directories to exist.
          mkdirp(entry.fileName, function() {
            if (err) return reject(err);
            zipfile.readEntry();
          });
        } else {
          mkdirp(path.dirname(entry.fileName), function() {
            zipfile.openReadStream(entry, function(err, readStream) {
              if (err) return reject(err);

              // console.log('Extracting', entry.fileName);

              readStream.on("error", function(err) {
                return reject(err);
              });

              readStream.on("end", function() {
                  zipfile.readEntry();
              });

              // pump file contents
              const writeStream = fs.createWriteStream(path.join(outputDir, entry.fileName));
              incrementHandleCount();
              writeStream.on("close", decrementHandleCount);
              readStream.pipe(writeStream);
            });
          });
        }
      });

      zipfile.on("error", function(err) {
        return reject(err);
      });
    });
  });
}
