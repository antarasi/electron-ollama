import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { githubFetch } from './github-fetch';
import { unzip } from './unzip';
import { untgz } from './untgz';

export type SpecificVersion = `v${number}.${number}.${number}`;
export type LatestVersion = 'latest';
export type Version = SpecificVersion | LatestVersion;

export interface ElectronOllamaConfig {
  basePath: string;
  directory?: string;
}

export interface PlatformConfig {
  os: 'windows' | 'darwin' | 'linux';
  arch: 'arm64' | 'amd64';
}

export interface OllamaAssetMetadata {
  digest: string;
  size: number;
  fileName: string;
  contentType: string;
  version: SpecificVersion;
  downloads: number;
  downloadUrl: string;
  releaseUrl: string;
  body: string;
}

export interface OllamaServerConfig {
  binPath: string;
}

export interface GitHubAsset {
  url: string;
  id: number;
  node_id: string;
  name: string;
  label: string | null;
  content_type: string;
  state: string;
  size: number;
  digest: string;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
}

export interface GitHubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  draft: boolean;
  immutable: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: GitHubAsset[];
  tarball_url: string;
  zipball_url: string;
  body: string;
}

export class ElectronOllamaServer {
  process: ChildProcess | null = null;

  constructor(config: OllamaServerConfig) {
    // Config parameter is required by API but not used in current implementation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void config;
  }

  /**
   * Stop the Ollama server
   */
  public stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

export class ElectronOllama {
  private config: ElectronOllamaConfig;

  constructor(config: ElectronOllamaConfig) {
    this.config = {
      directory: 'electron-ollama',
      ...config,
    };
  }

  /**
   * Get the current platform configuration
   */
  public currentPlatformConfig(): PlatformConfig {
    const platform = os.platform();
    const arch = os.arch();

    let osType: 'windows' | 'darwin' | 'linux';
    let architecture: 'arm64' | 'amd64';

    // Map platform
    switch (platform) {
      case 'win32':
        osType = 'windows';
        break;
      case 'darwin':
        osType = 'darwin';
        break;
      case 'linux':
        osType = 'linux';
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Map architecture
    switch (arch) {
      case 'arm64':
        architecture = 'arm64';
        break;
      case 'x64':
        architecture = 'amd64';
        break;
      default:
        throw new Error(`Unsupported architecture: ${arch}`);
    }

    return {
      os: osType,
      arch: architecture,
    };
  }

  public getAssetName(platformConfig: PlatformConfig): string {
    const { os, arch: architecture } = platformConfig;

    switch (os) {
      case 'windows':
        return `ollama-windows-${architecture}.zip`;
      case 'darwin':
        return 'ollama-darwin.tgz';
      case 'linux':
        return `ollama-linux-${architecture}.tgz`;
    }
  }

  /**
   * Get metadata for a specific version and platform
   */
  public async getMetadata(
    version: Version = 'latest',
    platformConfig: PlatformConfig = this.currentPlatformConfig()
  ): Promise<OllamaAssetMetadata> {
    const { os, arch: architecture } = platformConfig;

    const releaseUrlPath = version === 'latest' ? `latest` : `tags/${version}`;
    const gitHubResponse = await githubFetch(`https://api.github.com/repos/ollama/ollama/releases/${releaseUrlPath}`);
    const releaseData = await gitHubResponse.json() as GitHubRelease;
    const assetName = this.getAssetName(platformConfig);
    const asset = releaseData.assets.find((asset) => asset.name === assetName);

    if (!asset) {
      throw new Error(`${os}-${architecture} is not supported by Ollama ${releaseData.tag_name}`);
    }

    return {
      digest: asset.digest,
      size: asset.size,
      fileName: asset.name,
      contentType: asset.content_type,
      version: releaseData.tag_name as SpecificVersion,
      downloads: asset.download_count,
      downloadUrl: asset.browser_download_url,
      releaseUrl: releaseData.html_url,
      body: releaseData.body,
    };
  }

  /**
   * Download Ollama for the specified version and platform
   */
  public async download(
    version: Version = 'latest',
    platformConfig: PlatformConfig = this.currentPlatformConfig()
  ): Promise<void> {
    const metadata = await this.getMetadata(version, platformConfig);
    const versionDir = this.getBinPath(metadata.version, platformConfig);

    // 1. Create directory if it doesn't exist
    console.log('Creating directory if it doesn\'t exist');
    await fs.mkdir(versionDir, { recursive: true });

    // 2. Download the file
    console.log(`Downloading file to ${versionDir}`);
    const response = await fetch(metadata.downloadUrl);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(path.join(versionDir, metadata.fileName), Buffer.from(buffer));

    // 3. Extract the archive
    console.log(`Extracting archive ${metadata.fileName} in ${versionDir}`);
    if (metadata.contentType === 'application/zip') {
      await unzip(path.join(versionDir, metadata.fileName), versionDir);
    } else if (['application/x-gtar', 'application/x-tar', 'application/x-gzip', 'application/tar', 'application/gzip', 'application/x-tgz'].includes(metadata.contentType)) {
      await untgz(path.join(versionDir, metadata.fileName), versionDir);
    } else {
      throw new Error(`The Ollama asset type ${metadata.contentType} is not supported`);
    }

    // 4. Set executable permissions
    // 5. Verify checksum
  }

  /**
   * Check if a version is downloaded for the given platform configuration
   * @param version - The version to check, for example "v0.11.0"
   * @param platformConfig - The platform configuration to use, defaults to the current platform configuration
   * @returns True if the version is downloaded, false otherwise
   */
  public async isDownloaded(version: SpecificVersion, platformConfig: PlatformConfig = this.currentPlatformConfig()): Promise<boolean> {
    const binPath = this.getBinPath(version, platformConfig);
    return fs.access(binPath).then(() => true).catch(() => false);
  }

  /**
   * List all downloaded versions for the given platform configuration
   * @param platformConfig - The platform configuration to use, defaults to the current platform configuration
   * @returns A list of downloaded versions
   */
  public async downloadedVersions(platformConfig: PlatformConfig = this.currentPlatformConfig()): Promise<string[]> {
    const versions = await fs.readdir(path.join(this.config.basePath, this.config.directory!));
    return versions.filter((version) => this.isDownloaded(version as SpecificVersion, platformConfig));
  }

  /**
   * Get the path to the directory for the given version and platform configuration
   * @param version - The version to get the binary path for, for example "v0.11.0"
   * @param platformConfig - The platform configuration to use, defaults to the current platform configuration
   * @returns The path to the directory
   */
  private getBinPath(version: SpecificVersion, platformConfig: PlatformConfig = this.currentPlatformConfig()): string {
    return path.join(
      this.config.basePath,
      this.config.directory!,
      version,
      platformConfig.os,
      platformConfig.arch,
    );
  }

  private getExecutableName(platformConfig: PlatformConfig): string {
    switch (platformConfig.os) {
      case 'windows':
        return 'ollama.exe';
      case 'darwin':
        return 'ollama';
      case 'linux':
        return 'bin/ollama';
    }
  }

  /**
   * Start serving Ollama with the specified version
   */
  public async serve(version: SpecificVersion): Promise<ElectronOllamaServer> {
    const platformConfig = this.currentPlatformConfig();
    const binPath = this.getBinPath(version, platformConfig);

    // Ensure the binary exists
    if (!await this.isDownloaded(version, platformConfig)) {
      await this.download(version, platformConfig);
    }

    const server = new ElectronOllamaServer({ binPath });

    // Start the server process
    const process = spawn(binPath, [this.getExecutableName(platformConfig), 'serve']);

    server.process = process;

    process.stdout?.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr?.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });

    return server;
  }

  /**
   * Check if Ollama is running
   */
  public async isRunning(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434');
      const text = await response.text();
      return text.includes('Ollama is running');
    } catch {
      return false;
    }
  }
}

// Export default instance
export default ElectronOllama;
