# electron-ollama

A TypeScript library for integrating Ollama with Electron.js applications. This library provides a seamless way to bundle and manage Ollama within your Electron app for a better user experience.

[![npm version](https://img.shields.io/npm/v/electron-ollama)](https://npmjs.com/package/electron-ollama)

## Features

- 🛡️ **No conflict**: Works well with standalone Ollama server (skips installation if Ollama already runs)
- 🤝 **Maximum compatibility**: Can be imported by ESM and CommonJS packages
- 🚀 **TypeScript Support**: Full TypeScript support with type definitions
- 🔧 **Easy Integration**: Simple API for integrating Ollama with Electron apps
- 📦 **Binaries Management**: Automatically find and manage Ollama executables
- 🌐 **Cross-Platform**: Support for Windows, macOS, and Linux

## Installation

```bash
npm install electron-ollama
```

## Quick Start - Serve latest version if standalone Ollama is not running

```typescript
import { ElectronOllama, ElectronOllamaServer } from 'electron-ollama'

const eo = new ElectronOllama({
  basePath: app.getPath('userData') // binaries downloaded and extracted to <userData>/electron-ollama/<ollama_version>/<os>/<arch>
})
let server: ElectronOllamaServer | null = null

if (!(await eo.isRunning())) {
  const metadata = await eo.getMetadata('latest')
  server = await eo.serve(metadata.version)
} else {
  console.log('Ollama server is already running')
}

// gracefully shut down the server on parent process exit
process.on('SIGTERM', () => {
  if (server) {
    server.stop()
  }
  process.exit(0);
});

```

## Configuration

TBD

## Examples

### Run specific version of Ollama

```typescript
// TBD
```

### Download for multiple platforms

```typescript
// TBD
```

## List downloaded versions

```typescript
const eo = new ElectronOllama({
  basePath: '/Users/amatylewicz/dev/desktop-agent/ollama',
})

const currentVersion = await eo.downloadedVersions()
console.log('current platform versions', currentVersion) // [ 'v0.11.0', 'v0.11.3', 'v0.11.4' ]
const windowsVersions = await eo.downloadedVersions({ os: 'windows', arch: 'arm64' })
console.log('windows versions', windowsVersions) // [ 'v0.11.0', 'v0.11.1' ]
```

## API Reference

<!-- automd:file src="dist/index.d.ts" code -->

```ts [index.d.ts]
import { ElectronOllamaConfig, OllamaServerConfig, PlatformConfig, OllamaAssetMetadata, SpecificVersion, Version } from './types';
import { ElectronOllamaServer } from './server';
export type { ElectronOllamaConfig, OllamaServerConfig, PlatformConfig, OllamaAssetMetadata, SpecificVersion, Version };
export { ElectronOllamaServer };
export declare class ElectronOllama {
    private config;
    constructor(config: ElectronOllamaConfig);
    /**
     * Get the current platform configuration
     */
    currentPlatformConfig(): PlatformConfig;
    /**
     * Get the name of the asset for the given platform configuration (e.g. "ollama-windows-amd64.zip" or "ollama-darwin.tgz")
     */
    getAssetName(platformConfig: PlatformConfig): string;
    /**
     * Get metadata for a specific version ('latest' by default) and platform
     */
    getMetadata(version?: Version, platformConfig?: PlatformConfig): Promise<OllamaAssetMetadata>;
    /**
     * Download Ollama for the specified version ('latest' by default) and platform
     */
    download(version?: Version, platformConfig?: PlatformConfig): Promise<void>;
    /**
     * Check if a version is downloaded for the given platform configuration
     */
    isDownloaded(version: SpecificVersion, platformConfig?: PlatformConfig): Promise<boolean>;
    /**
     * List all downloaded versions for the given platform configuration
     */
    downloadedVersions(platformConfig?: PlatformConfig): Promise<string[]>;
    /**
     * Get the path to the directory for the given version and platform configuration
     */
    getBinPath(version: SpecificVersion, platformConfig?: PlatformConfig): string;
    /**
     * Get the name of the executable for the given platform configuration
     */
    getExecutableName(platformConfig: PlatformConfig): string;
    /**
     * Start serving Ollama with the specified version
     */
    serve(version: SpecificVersion): Promise<ElectronOllamaServer>;
    /**
     * Check if Ollama is running
     */
    isRunning(): Promise<boolean>;
}
export default ElectronOllama;
//# sourceMappingURL=index.d.ts.map
```

<!-- /automd -->

## Ollama Clients

- [ollama-js](https://github.com/ollama/ollama-js)

## TODO

- Detect AMD ROCM support and support additional platform variants like jetpack

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/antarasi/electron-ollama/issues) on GitHub.
