import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { githubFetch } from './github-fetch';
import { unzipFile } from './unzip';
import { untgzStream } from './untgz';
import { ElectronOllamaConfig, OllamaServerConfig, PlatformConfig, OllamaAssetMetadata, GitHubRelease, SpecificVersion, Version } from './types';
import { ElectronOllamaServer } from './server';
import { Readable } from 'stream';
export type { ElectronOllamaConfig, OllamaServerConfig, PlatformConfig, OllamaAssetMetadata, SpecificVersion, Version };
export { ElectronOllamaServer };

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

  /**
   * Get the name of the asset for the given platform configuration (e.g. "ollama-windows-amd64.zip" or "ollama-darwin.tgz")
   */
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
   * Get metadata for a specific version ('latest' by default) and platform
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
   * Download Ollama for the specified version ('latest' by default) and platform
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

    // 3. Extract the archive
    console.log(`Extracting archive ${metadata.fileName} in ${versionDir}`);
    if (metadata.contentType === 'application/zip') {
      const buffer = await response.arrayBuffer();
      await fs.writeFile(path.join(versionDir, metadata.fileName), Buffer.from(buffer));
      await unzipFile(path.join(versionDir, metadata.fileName), versionDir, true);
    } else if (['application/x-gtar', 'application/x-tar', 'application/x-gzip', 'application/tar', 'application/gzip', 'application/x-tgz'].includes(metadata.contentType)) {
      const stream = Readable.from(response.body!);
      await untgzStream(stream, versionDir);
    } else {
      throw new Error(`The Ollama asset type ${metadata.contentType} is not supported`);
    }

    // 4. Verify checksum
  }

  /**
   * Check if a version is downloaded for the given platform configuration
   */
  public async isDownloaded(version: SpecificVersion, platformConfig: PlatformConfig = this.currentPlatformConfig()): Promise<boolean> {
    const binPath = this.getBinPath(version, platformConfig);
    return fs.access(binPath).then(() => true).catch(() => false);
  }

  /**
   * List all downloaded versions for the given platform configuration
   */
  public async downloadedVersions(platformConfig: PlatformConfig = this.currentPlatformConfig()): Promise<string[]> {
    let versions: string[] = []
    try {
      versions = await fs.readdir(path.join(this.config.basePath, this.config.directory!));
    } catch {
      return [] // directory does not exist - nothing to list
    }

    const downloaded = await Promise.all(versions.map((version) => this.isDownloaded(version as SpecificVersion, platformConfig)));
    return versions.filter((_version, index) => downloaded[index]);
  }

  /**
   * Get the path to the directory for the given version and platform configuration
   */
  public getBinPath(version: SpecificVersion, platformConfig: PlatformConfig = this.currentPlatformConfig()): string {
    return path.join(
      this.config.basePath,
      this.config.directory!,
      version,
      platformConfig.os,
      platformConfig.arch,
    );
  }

  /**
   * Get the name of the executable for the given platform configuration
   */
  public getExecutableName(platformConfig: PlatformConfig): string {
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

    const server = new ElectronOllamaServer({
      binPath,
      log: this.config.serveLog || (() => {}),
    });
    server.start(this.getExecutableName(platformConfig));

    // Wait for the server to start
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (await this.isRunning()) {
        return server;
      }
    }

    throw new Error('Ollama server failed to start in 5 seconds');
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
