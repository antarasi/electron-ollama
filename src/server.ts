import { spawn, ChildProcess } from 'child_process';
import { OllamaServerConfig } from './types';
import * as path from 'path';

export class ElectronOllamaServer {
  private process: ChildProcess | null = null;
  private binPath: string;

  constructor(config: OllamaServerConfig) {
    this.binPath = config.binPath;
  }

  public start(executableName: string): void {
    this.process = spawn(path.join(this.binPath, executableName), ['serve'], {
      cwd: this.binPath,
    });

    this.process.stdout?.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    this.process.stderr?.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    this.process.on('error', (error) => {
      console.error(`Ollama server process error: ${error}`);
      this.process = null;
    });

    this.process.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
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
