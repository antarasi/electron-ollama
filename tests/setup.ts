// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: {
      on: jest.fn(),
    },
    stderr: {
      on: jest.fn(),
    },
    on: jest.fn(),
    kill: jest.fn(),
  }),
}));

// Mock fs and stream
import { Readable, Writable } from 'stream';

jest.mock('fs', () => {
  const mockReadStream = new Readable();
  mockReadStream._read = () => {};
  mockReadStream.pipe = jest.fn().mockImplementation((dest) => {
    process.nextTick(() => {
      mockReadStream.emit('end');
      dest.emit('finish');
    });
    return dest;
  });

  const mockWriteStream = new Writable();
  mockWriteStream._write = () => {};

  return {
    existsSync: jest.fn(),
    open: jest.fn(),
    createReadStream: jest.fn().mockImplementation(() => {
      const stream = new Readable();
      stream._read = () => {};
      stream.pipe = jest.fn().mockImplementation((dest) => {
        process.nextTick(() => {
          stream.emit('end');
          dest.emit('finish');
        });
        return dest;
      });
      return stream;
    }),
    createWriteStream: jest.fn().mockReturnValue(mockWriteStream),
    constants: {
      O_CREAT: 0,
      O_TRUNC: 0,
      O_WRONLY: 0,
      O_EXCL: 0,
      O_APPEND: 0
    }
  };
});

// Mock tar
jest.mock('tar', () => ({
  extract: jest.fn().mockImplementation(() => {
    const mockStream = new Writable();
    mockStream._write = (_chunk, _encoding, callback) => {
      callback();
    };
    process.nextTick(() => {
      mockStream.emit('finish');
    });
    return mockStream;
  })
}));

// Mock yauzl
jest.mock('yauzl', () => ({
  open: jest.fn().mockImplementation((_filePath, _options, callback) => {
    const mockZipFile = {
      readEntry: jest.fn().mockImplementation(() => {
        process.nextTick(() => {
          mockZipFile.emit('end');
        });
      }),
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === 'close') {
          process.nextTick(() => handler());
        }
        if (event === 'end') {
          process.nextTick(() => handler());
        }
      }),
      openReadStream: jest.fn().mockImplementation((_entry, callback) => {
        const stream = new Readable();
        stream._read = () => {};
        stream.pipe = jest.fn().mockImplementation((dest) => {
          process.nextTick(() => {
            stream.emit('end');
            dest.emit('finish');
          });
          return dest;
        });
        process.nextTick(() => callback(null, stream));
      }),
      emit: jest.fn()
    };
    process.nextTick(() => callback(null, mockZipFile));
  })
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readdir: jest.fn(),
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Increase timeout for tests
jest.setTimeout(10000);
