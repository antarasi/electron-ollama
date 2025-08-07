# electron-ollama

A TypeScript library for integrating Ollama with Electron.js applications. This library provides a seamless way to bundle and manage Ollama within your Electron app for a better user experience.

## Features

- 🚀 **TypeScript Support**: Full TypeScript support with type definitions
- 🔧 **Easy Integration**: Simple API for integrating Ollama with Electron apps
- 📦 **Bundle Management**: Automatically find and manage Ollama executables
- 🌐 **Cross-Platform**: Support for Windows, macOS, and Linux
- 🧪 **Testing Ready**: Comprehensive test setup with Jest
- 📝 **Well Documented**: Complete API documentation and examples

## Installation

```bash
npm install electron-ollama
```

## Quick Start

```typescript
import { ElectronOllama } from 'electron-ollama';

// Create an instance
const ollama = new ElectronOllama({
  directory: 'electron-ollama',
});

// Get current platform configuration
const platformConfig = ollama.currentPlatformConfig();
console.log(platformConfig); // { os: 'darwin', architecture: 'arm64', executable: 'ollama' }

// Check if Ollama is running
const isRunning = await ollama.isRunning();

if (!isRunning) {
  // Download and start Ollama
  await ollama.download();
  const server = await ollama.serve();
  
  // Use the server...
  server.stop();
}
```

## API Reference

### ElectronOllama Class

#### Constructor

```typescript
new ElectronOllama(config?: ElectronOllamaConfig)
```

**Configuration Options:**
- `directory`: Directory where Ollama will be stored (default: 'electron-ollama')

#### Methods

##### `currentPlatformConfig(): PlatformConfig`
Get the current platform configuration.

##### `getMetadata(version?: string, platformConfig?: PlatformConfig): Promise<OllamaMetadata>`
Get metadata for a specific version and platform.

##### `download(version?: string, platformConfig?: PlatformConfig): Promise<void>`
Download Ollama for the specified version and platform.

##### `serve(version?: string): Promise<OllamaServer>`
Start serving Ollama with the specified version.

##### `isRunning(): Promise<boolean>`
Check if Ollama is running by making a request to localhost:11434.

### OllamaServer Class

#### Constructor

```typescript
new OllamaServer(config: OllamaServerConfig)
```

**Configuration Options:**
- `binPath`: Absolute path to the Ollama executable

#### Methods

##### `stop(): void`
Stop the Ollama server.

### Types

#### ElectronOllamaConfig
```typescript
interface ElectronOllamaConfig {
  directory?: string;
}
```

#### PlatformConfig
```typescript
interface PlatformConfig {
  os: 'windows' | 'darwin' | 'linux';
  architecture: 'arm64' | 'amd64';
  variant?: 'rocm';
  executable: string;
}
```

#### OllamaMetadata
```typescript
interface OllamaMetadata {
  sha256: string;
  size: number;
  assetName: string;
  version: string;
  downloads: number;
  downloadUrl: string;
  releaseUrl: string;
}
```

#### OllamaServerConfig
```typescript
interface OllamaServerConfig {
  binPath: string;
}
```

## Examples

### Basic Usage

```typescript
import { ElectronOllama } from 'electron-ollama';

const ollama = new ElectronOllama();

async function main() {
  try {
    // Get platform info
    const platform = ollama.currentPlatformConfig();
    console.log('Platform:', platform);

    // Check if running
    const isRunning = await ollama.isRunning();
    console.log('Ollama running:', isRunning);

    if (!isRunning) {
      // Get metadata
      const metadata = await ollama.getMetadata();
      console.log('Latest version:', metadata.version);

      // Download and start
      await ollama.download();
      const server = await ollama.serve();
      
      // Wait for startup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify it's running
      const nowRunning = await ollama.isRunning();
      console.log('Now running:', nowRunning);

      // Stop when done
      server.stop();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### Version-Specific Usage

```typescript
import { ElectronOllama } from 'electron-ollama';

const ollama = new ElectronOllama();

async function specificVersion() {
  // Get metadata for specific version
  const metadata = await ollama.getMetadata('v0.8.0');
  console.log('Version info:', metadata);

  // Download specific version
  await ollama.download('v0.8.0');

  // Serve specific version
  const server = await ollama.serve('v0.8.0');
  
  // Use the server...
  server.stop();
}

specificVersion();
```

### Cross-Platform Usage

```typescript
import { ElectronOllama } from 'electron-ollama';

const ollama = new ElectronOllama();

async function crossPlatform() {
  // Custom platform configuration
  const customPlatform = {
    os: 'linux' as const,
    architecture: 'amd64' as const,
    executable: 'ollama',
  };

  // Get metadata for custom platform
  const metadata = await ollama.getMetadata('latest', customPlatform);
  console.log('Linux AMD64 metadata:', metadata);

  // Download for custom platform
  await ollama.download('latest', customPlatform);
}

crossPlatform();
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/antarasi/electron-ollama.git
cd electron-ollama
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Available Scripts

- `npm run build` - Build the TypeScript code
- `npm run dev` - Watch mode for development
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check without emitting files

### Testing

```bash
npm test
```

The project includes comprehensive tests with Jest and proper mocking for Node.js modules.

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
