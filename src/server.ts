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

    this.log(`Ollama server pid: ${this.process.pid}`);

    this.process.stdout?.on('data', this.log);
    this.process.stderr?.on('data', this.log);

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
  public stop(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
