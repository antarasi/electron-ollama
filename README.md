# electron-ollama

A TypeScript library for integrating Ollama with Electron.js applications. This library provides a seamless way to bundle and manage Ollama within your Electron app for a better user experience.

[![npm version](https://img.shields.io/npm/v/electron-ollama)](https://npmjs.com/package/electron-ollama)
![github action](https://github.com/antarasi/electron-ollama/actions/workflows/npm-publish.yml/badge.svg)


## Why

Because every extra installation step creates friction, bundling Ollama ensures a smooth, seamless experience. With **electron-ollama**, users skip the hassle of finding installers or running commands — no separate Ollama setup required.
It detects existing Ollama instance or installs automatically if missing, so users simply open your app and it works.

## Features

- 🛡️ **No conflict**: Works well with standalone Ollama server (skips installation if Ollama already runs)
- 🤝 **Maximum compatibility**: Can be imported by ESM and CommonJS packages
- 🚀 **TypeScript Support**: Full TypeScript support with type definitions
- 🔧 **Easy Integration**: Simple API for integrating Ollama with Electron apps
- 📦 **Binaries Management**: Automatically find and manage Ollama executables
- 🌐 **Cross-Platform**: Tested on Windows, macOS, and Linux

## Installation

```bash
npm install electron-ollama
```

## Quick Start - Serve latest version if standalone Ollama is not running

<!-- automd:file src="examples/serve-latest.ts" code -->

```ts [serve-latest.ts]
import { ElectronOllama, ElectronOllamaServer } from '../dist' // replace with: import { ElectronOllama, ElectronOllamaServer } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
    serveLog: (message) => console.log('Ollama: ', message),
  })
  let server: ElectronOllamaServer | null = null

  if (!(await eo.isRunning())) {
    const metadata = await eo.getMetadata('latest')
    server = await eo.serve(metadata.version)
  } else {
    console.log('Ollama server is already running')
  }
}

main()
```

<!-- /automd -->

#### Try it
```bash
npm run build
npx tsx examples/serve-latest.ts
```

## Configuration


| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `basePath` | `string` | Yes | - | The base directory where Ollama binaries will be downloaded and stored. Typically `app.getPath('userData')` in Electron apps. |
| `directory` | `string` | No | `'electron-ollama'` | Subdirectory name within `basePath` where Ollama versions will be organized. Final path structure: `{basePath}/{directory}/{version}/{os}/{arch}/` |
| `serveLog` | `(message: string) => void` | No | `undefined` | Optional callback function to handle log messages from the Ollama server. Useful for debugging or displaying server status in your application. |

## Examples

### Serve specific version of Ollama

<!-- automd:file src="examples/serve-version.ts" code -->

```ts [serve-version.ts]
import { ElectronOllama, ElectronOllamaServer } from '../dist' // replace with: import { ElectronOllama } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
    serveLog: (message) => console.log('Ollama: ', message),
  })
  let server: ElectronOllamaServer | null = null

  if (!(await eo.isRunning())) {
    server = await eo.serve('v0.11.0') // Welcome OpenAI's gpt-oss models

    const liveVersion = await fetch('http://localhost:11434/api/version').then(res => res.json())

    console.log('Currently running Ollama', liveVersion)

    await server.stop() // gracefully stop the server with 5s timeout
  } else {
    console.log('Ollama server is already running')
  }
}

main()
```

<!-- /automd -->

#### Try it
```bash
npm run build
npx tsx examples/serve-version.ts
```

### Download for multiple platforms

<!-- automd:file src="examples/download-windows-mac-linux.ts" code -->

```ts [download-windows-mac-linux.ts]
import { ElectronOllama } from '../dist' // replace with: import { ElectronOllama } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
  })

  const metadata = await eo.getMetadata('latest')

  await eo.download(metadata.version, { os: 'windows', arch: 'arm64' })
  await eo.download(metadata.version, { os: 'darwin', arch: 'arm64' })
  await eo.download(metadata.version, { os: 'linux', arch: 'arm64' })

  console.log('Downloaded', metadata.version, 'for windows, mac and linux')
}

main()
```

<!-- /automd -->

#### Try it
```bash
npm run build
npx tsx examples/download-windows-mac-linux.ts
```

## List downloaded versions

<!-- automd:file src="examples/list-downloaded.ts" code -->

```ts [list-downloaded.ts]
import { ElectronOllama } from '../dist' // replace with: import { ElectronOllama } from 'electron-ollama'
import { app } from './mock/electron' // on electron app replace with: import { app } from 'electron'

async function main() {
  const eo = new ElectronOllama({
    basePath: app.getPath('userData'),
  })

  const currentVersion = await eo.downloadedVersions()
  console.log('current platform versions', currentVersion) // [ 'v0.11.0', 'v0.11.2', 'v0.11.4' ]
  const windowsVersions = await eo.downloadedVersions({ os: 'windows', arch: 'arm64' })
  console.log('windows versions', windowsVersions) // [ 'v0.11.4' ]
}

main()
```

<!-- /automd -->

#### Try it
```bash
npm run build
npx tsx examples/list-downloaded.ts
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

## Notes

- While the primary use case of this package is to seamlessly integrate Ollama with an Electron app, this package intentionally doesn't have a dependency on Electron itself. By simply providing a different `basePath` than the electron `app.getPath('userData')` you can manage Ollama process on virtually any NodeJS app.
- This library does not modify Ollama binaries. The Ollama server is provided as is. electron-ollama is merely a convenience library to pick the appropriate binary for os/arch and start the server if needed.
- You can use electron-ollama as runtime dependency to manage LLM backend in the app or you can use it as part of your prebuild script to ship Ollama binaries with your app.

## TODO

- Detect AMD ROCM support and support additional platform variants like jetpack
- Investigate if any prerequisites are required to be installed first like vc_redist.exe on windows

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
