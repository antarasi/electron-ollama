import { spawn, ChildProcess } from 'child_process';
import { OllamaServerConfig } from './types';
import * as path from 'path';

export class ElectronOllamaServer {
  private process: ChildProcess | null = null;
  private binPath: string;
  private log: (message: string) => void;

  constructor(config: OllamaServerConfig) {
    this.binPath = config.binPath;
    this.log = config.log;
  }

  public start(executableName: string): void {
    this.process = spawn(path.join(this.binPath, executableName), ['serve'], {
      cwd: this.binPath,
    });

    if (!this.process?.pid) {
      this.stop(); // TODO should await
      this.log('Failed to start Ollama server process: ' + path.join(this.binPath, executableName))
      throw new Error('Failed to start Ollama server process')
    }

    this.log(`Ollama server pid: ${this.process.pid}`);

    this.process.stdout?.on('data', data => this.log(`${data}`));
    this.process.stderr?.on('data', data => this.log(`${data}`));

    this.process.on('error', (error) => {
      this.log(`Ollama server process error: ${error}`);
      this.process = null;
    });

    this.process.on('close', (code) => {
      this.log(`Ollama server exited with code ${code}`);
    });
  }

  /**
   * Stop the Ollama server
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.process) {
        return resolve();
      }

      const cleanup = () => {
        this.process = null;
        resolve();
      };

      const timeout = setTimeout(() => {
        this.log('Timeout waiting for Ollama server to close, forcing cleanup');
        cleanup();
      }, 5000);

      this.process.on('close', () => {
        clearTimeout(timeout);
        cleanup();
      });

      this.process.kill();
    });
  }
}
