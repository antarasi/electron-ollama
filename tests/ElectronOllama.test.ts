import { ElectronOllama, ElectronOllamaServer } from '../src/index';
import { ElectronOllamaConfig, PlatformConfig, GitHubRelease } from '../src/types';
import { ChildProcess } from 'child_process';

import * as fs from 'fs';
import * as os from 'os';

// Mock modules
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('os');
jest.mock('../src/unzip', () => ({
  unzip: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../src/untgz', () => ({
  untgz: jest.fn().mockResolvedValue(undefined),
}));
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

// Mock global fetch
global.fetch = jest.fn();

// Mock githubFetch
jest.mock('../src/github-fetch', () => ({
  githubFetch: jest.fn(),
}));

const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
const mockPlatform = os.platform as jest.MockedFunction<typeof os.platform>;
const mockArch = os.arch as jest.MockedFunction<typeof os.arch>;

// Mock fs/promises
import * as fsPromises from 'fs/promises';
const mockFsAccess = fsPromises.access as jest.MockedFunction<typeof fsPromises.access>;
const mockFsReaddir = fsPromises.readdir as jest.MockedFunction<typeof fsPromises.readdir> & { mockImplementation: (fn: () => Promise<fs.Dirent[]>) => void };

// Import the mocked modules
import { githubFetch } from '../src/github-fetch';
import { unzip } from '../src/unzip';
import { untgz } from '../src/untgz';
const mockGithubFetch = githubFetch as jest.MockedFunction<typeof githubFetch>;
const mockUnzip = unzip as jest.MockedFunction<typeof unzip>;
const mockUntgz = untgz as jest.MockedFunction<typeof untgz>;

// Mock GitHub API response data
import mockGitHubRelease from './github-release.mock.json';

describe('ElectronOllama', () => {
  let ollama: ElectronOllama;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockPlatform.mockReturnValue('darwin');
    mockArch.mockReturnValue('arm64');

    // Mock fs/promises methods
    mockFsAccess.mockResolvedValue(undefined);
    mockFsReaddir.mockImplementation(() => {
      const dirents = [
        {
          name: 'v0.11.0',
          isFile: () => false,
          isDirectory: () => true,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isFIFO: () => false,
          isSocket: () => false,
        } as fs.Dirent,
        {
          name: 'v0.10.0',
          isFile: () => false,
          isDirectory: () => true,
          isBlockDevice: () => false,
          isCharacterDevice: () => false,
          isSymbolicLink: () => false,
          isFIFO: () => false,
          isSocket: () => false,
        } as fs.Dirent
      ];
      return Promise.resolve(dirents);
    });

    // Setup conditional githubFetch mock
    mockGithubFetch.mockImplementation((url: string) => {
      if (url.startsWith('https://api.github.com/repos/ollama/ollama/releases')) {
        return Promise.resolve({
          json: jest.fn().mockResolvedValue(mockGitHubRelease)
        } as unknown as Response);
      }
      // Return a default response for other URLs
      return Promise.resolve({
        json: jest.fn().mockResolvedValue({})
      } as unknown as Response);
    });

    ollama = new ElectronOllama({ basePath: '/tmp' });
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      expect(ollama).toBeInstanceOf(ElectronOllama);
    });

    it('should create instance with custom config', () => {
      const config: ElectronOllamaConfig = {
        basePath: '/custom/path',
        directory: 'custom-ollama-dir',
      };

      const customOllama = new ElectronOllama(config);
      expect(customOllama).toBeInstanceOf(ElectronOllama);
    });
  });

  describe('currentPlatformConfig', () => {
    it('should return correct config for macOS ARM64', () => {
      mockPlatform.mockReturnValue('darwin');
      mockArch.mockReturnValue('arm64');

      const config = ollama.currentPlatformConfig();

      expect(config).toEqual({
        os: 'darwin',
        arch: 'arm64',
      });
    });

    it('should return correct config for Windows AMD64', () => {
      mockPlatform.mockReturnValue('win32');
      mockArch.mockReturnValue('x64');

      const config = ollama.currentPlatformConfig();

      expect(config).toEqual({
        os: 'windows',
        arch: 'amd64',
      });
    });

    it('should return correct config for Linux AMD64', () => {
      mockPlatform.mockReturnValue('linux');
      mockArch.mockReturnValue('x64');

      const config = ollama.currentPlatformConfig();

      expect(config).toEqual({
        os: 'linux',
        arch: 'amd64',
      });
    });

    it('should throw error for unsupported platform', () => {
      mockPlatform.mockReturnValue('freebsd');

      expect(() => ollama.currentPlatformConfig()).toThrow('Unsupported platform: freebsd');
    });

    it('should throw error for unsupported architecture', () => {
      mockPlatform.mockReturnValue('darwin');
      mockArch.mockReturnValue('ia32');

      expect(() => ollama.currentPlatformConfig()).toThrow('Unsupported architecture: ia32');
    });
  });

  describe('getAssetName', () => {
    it('should return correct asset name for Windows AMD64', () => {
      const platformConfig: PlatformConfig = {
        os: 'windows',
        arch: 'amd64',
      };

      const assetName = ollama.getAssetName(platformConfig);
      expect(assetName).toBe('ollama-windows-amd64.zip');
    });

    it('should return correct asset name for macOS', () => {
      const platformConfig: PlatformConfig = {
        os: 'darwin',
        arch: 'arm64',
      };

      const assetName = ollama.getAssetName(platformConfig);
      expect(assetName).toBe('ollama-darwin.tgz');
    });

    it('should return correct asset name for Linux AMD64', () => {
      const platformConfig: PlatformConfig = {
        os: 'linux',
        arch: 'amd64',
      };

      const assetName = ollama.getAssetName(platformConfig);
      expect(assetName).toBe('ollama-linux-amd64.tgz');
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for latest version', async () => {
      const metadata = await ollama.getMetadata();

      expect(mockGithubFetch).toHaveBeenCalledWith('https://api.github.com/repos/ollama/ollama/releases/latest');
      expect(metadata).toEqual({
        digest: 'sha256:88ac973d4aaa8fed68898be45ca16a4c0e80434d068afdc18b304863fe99d064',
        size: 23699596,
        fileName: 'ollama-darwin.tgz',
        contentType: 'application/gzip',
        version: 'v0.11.0',
        downloads: 115,
        downloadUrl: 'https://github.com/ollama/ollama/releases/download/v0.11.0/ollama-darwin.tgz',
        releaseUrl: 'https://github.com/ollama/ollama/releases/tag/v0.11.0',
        body: expect.stringContaining('Welcome OpenAI\'s gpt-oss models'),
      });
    });

    it('should return metadata for specific version', async () => {
      const metadata = await ollama.getMetadata('v0.8.0');

      expect(mockGithubFetch).toHaveBeenCalledWith('https://api.github.com/repos/ollama/ollama/releases/tags/v0.8.0');
      expect(metadata).toEqual({
        digest: 'sha256:88ac973d4aaa8fed68898be45ca16a4c0e80434d068afdc18b304863fe99d064',
        size: 23699596,
        fileName: 'ollama-darwin.tgz',
        contentType: 'application/gzip',
        version: 'v0.11.0',
        downloads: 115,
        downloadUrl: 'https://github.com/ollama/ollama/releases/download/v0.11.0/ollama-darwin.tgz',
        releaseUrl: 'https://github.com/ollama/ollama/releases/tag/v0.11.0',
        body: expect.stringContaining('Welcome OpenAI\'s gpt-oss models'),
      });
    });

    it('should return metadata for custom platform config', async () => {
      const platformConfig: PlatformConfig = {
        os: 'linux',
        arch: 'amd64',
      };

      const metadata = await ollama.getMetadata('latest', platformConfig);

      expect(metadata.fileName).toBe('ollama-linux-amd64.tgz');
      expect(metadata.downloadUrl).toContain('ollama-linux-amd64.tgz');
    });

    it('should throw error when asset is not found', async () => {
      // Mock a release without the expected asset
      const releaseWithoutAsset = {
        ...mockGitHubRelease,
        assets: [],
      };

      mockGithubFetch.mockResolvedValue({
        json: jest.fn().mockResolvedValue(releaseWithoutAsset)
      } as unknown as Response);

      await expect(ollama.getMetadata()).rejects.toThrow('darwin-arm64 is not supported by Ollama v0.11.0');
    });
  });

  describe('download', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
    });

    it('should call getMetadata and log download info', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await ollama.download();

      expect(consoleSpy).toHaveBeenCalledWith('Creating directory if it doesn\'t exist');
      expect(consoleSpy).toHaveBeenCalledWith('Downloading file to /tmp/electron-ollama/v0.11.0/darwin/arm64');
      expect(consoleSpy).toHaveBeenCalledWith('Extracting archive ollama-darwin.tgz in /tmp/electron-ollama/v0.11.0/darwin/arm64');
      expect(mockUntgz).toHaveBeenCalled(); // Darwin uses .tgz by default

      consoleSpy.mockRestore();
    });

    it('should download with custom version and platform', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const platformConfig: PlatformConfig = {
        os: 'windows',
        arch: 'amd64',
      };

      await ollama.download('v0.8.0', platformConfig);

      expect(consoleSpy).toHaveBeenCalledWith('Creating directory if it doesn\'t exist');
      expect(consoleSpy).toHaveBeenCalledWith('Downloading file to /tmp/electron-ollama/v0.11.0/windows/amd64');
      expect(consoleSpy).toHaveBeenCalledWith('Extracting archive ollama-windows-amd64.zip in /tmp/electron-ollama/v0.11.0/windows/amd64');
      expect(mockUnzip).toHaveBeenCalled(); // Windows uses .zip

      consoleSpy.mockRestore();
    });

    it('should extract .tgz files correctly', async () => {
      // Mock GitHub response to return a .tgz file
      mockGithubFetch.mockImplementationOnce(() => Promise.resolve({
        json: jest.fn().mockResolvedValue({
          ...mockGitHubRelease,
          assets: [{
            ...mockGitHubRelease.assets[0],
            name: 'ollama-linux-amd64.tgz',
            content_type: 'application/gzip'
          }]
        } as GitHubRelease)
      } as unknown as Response));

      const platformConfig: PlatformConfig = {
        os: 'linux',
        arch: 'amd64',
      };

      await ollama.download('latest', platformConfig);

      expect(mockUntgz).toHaveBeenCalled();
      expect(mockUnzip).not.toHaveBeenCalled();
    });

    it('should extract .zip files correctly', async () => {
      // Mock GitHub response to return a .zip file
      mockGithubFetch.mockImplementationOnce(() => Promise.resolve({
        json: jest.fn().mockResolvedValue({
          ...mockGitHubRelease,
          assets: [{
            ...mockGitHubRelease.assets[0],
            name: 'ollama-windows-amd64.zip',
            content_type: 'application/zip'
          }]
        } as GitHubRelease)
      } as unknown as Response));

      const platformConfig: PlatformConfig = {
        os: 'windows',
        arch: 'amd64',
      };

      await ollama.download('latest', platformConfig);

      expect(mockUnzip).toHaveBeenCalled();
      expect(mockUntgz).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported content type', async () => {
      // Mock GitHub response to return an unsupported file type
      mockGithubFetch.mockImplementationOnce(() => Promise.resolve({
        json: jest.fn().mockResolvedValue({
          ...mockGitHubRelease,
          assets: [{
            ...mockGitHubRelease.assets[0],
            name: 'ollama-windows-amd64.rar',
            content_type: 'application/x-rar-compressed'
          }]
        } as GitHubRelease)
      } as unknown as Response));

      const platformConfig: PlatformConfig = {
        os: 'windows',
        arch: 'amd64',
      };

      await expect(ollama.download('latest', platformConfig))
        .rejects
        .toThrow('windows-amd64 is not supported by Ollama v0.11.0');
    });
  });

  describe('serve', () => {
    it('should create OllamaServer instance', async () => {
      const server = await ollama.serve('v0.11.0');

      expect(server).toBeInstanceOf(ElectronOllamaServer);
    });

    it('should download binary if it does not exist', async () => {
      mockFsAccess.mockRejectedValue(new Error('File not found'));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockResponse = {
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await ollama.serve('v0.11.0');

      expect(consoleSpy).toHaveBeenCalledWith('Creating directory if it doesn\'t exist');
      expect(consoleSpy).toHaveBeenCalledWith('Downloading file to /tmp/electron-ollama/v0.11.0/darwin/arm64');
      expect(consoleSpy).toHaveBeenCalledWith('Extracting archive ollama-darwin.tgz in /tmp/electron-ollama/v0.11.0/darwin/arm64');

      consoleSpy.mockRestore();
    });
  });

  describe('isDownloaded', () => {
    it('should return true when version is downloaded', async () => {
      mockFsAccess.mockResolvedValue(undefined);

      const result = await ollama.isDownloaded('v0.11.0');

      expect(result).toBe(true);
      expect(mockFsAccess).toHaveBeenCalledWith(expect.stringContaining('v0.11.0/darwin/arm64'));
    });

    it('should return false when version is not downloaded', async () => {
      mockFsAccess.mockRejectedValue(new Error('File not found'));

      const result = await ollama.isDownloaded('v0.11.0');

      expect(result).toBe(false);
    });
  });


  describe('isRunning', () => {
    it('should return true when Ollama is running', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        text: jest.fn().mockResolvedValue('Ollama is running'),
      });

      const result = await ollama.isRunning();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434');
    });

    it('should return false when Ollama is not running', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        text: jest.fn().mockResolvedValue('Something else'),
      });

      const result = await ollama.isRunning();

      expect(result).toBe(false);
    });

    it('should return false when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await ollama.isRunning();

      expect(result).toBe(false);
    });
  });
});

describe('OllamaServer', () => {
  it('should create instance with config', () => {
    const config = { binPath: '/path/to/ollama', log: jest.fn() };
    const server = new ElectronOllamaServer(config);

    expect(server).toBeInstanceOf(ElectronOllamaServer);
  });

  it('should stop the server', () => {
    const config = { binPath: '/path/to/ollama', log: jest.fn() };
    const server = new ElectronOllamaServer(config);

    // Mock the process
    const mockProcess = {
      kill: jest.fn(),
    } as unknown as ChildProcess;
    (server as unknown as { process: ChildProcess | null }).process = mockProcess;

    server.stop();

    expect(mockProcess.kill).toHaveBeenCalled();
    expect((server as unknown as { process: ChildProcess | null }).process).toBeNull();
  });
});
