import { ChildProcess, spawn, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

export interface LlamaStatus {
  running: boolean;
  pid: number | null;
  model: string;
  port: number;
  uptime: number;
}

export class LlamaManager {
  private process: ChildProcess | null = null;
  private port: number = 8081;
  private currentModel: string = '';
  private startTime: number = 0;
  private llamaServerPath: string = '';

  constructor() {
    this.llamaServerPath = this.findLlamaServer();
  }

  private findLlamaServer(): string {
    const possiblePaths = [
      path.join(process.resourcesPath || '', 'llama-server', 'llama-server.exe'),
      path.join(__dirname, '..', '..', 'resources', 'llama-server', 'llama-server.exe'),
      'D:\\002\\Ollama\\lib\\ollama\\llama-server.exe',
      'C:\\Program Files\\Ollama\\llama-server.exe'
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        console.log('[LlamaManager] Found llama-server at:', p);
        return p;
      }
    }

    console.warn('[LlamaManager] llama-server not found, using default path');
    return possiblePaths[0];
  }

  setPort(port: number): void {
    this.port = port;
  }

  getPort(): number {
    return this.port;
  }

  getStatus(): LlamaStatus {
    return {
      running: this.process !== null && !this.process.killed,
      pid: this.process?.pid || null,
      model: this.currentModel,
      port: this.port,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  async start(modelPath: string): Promise<void> {
    if (this.process && !this.process.killed) {
      console.warn('[LlamaManager] Server already running, stopping first...');
      await this.stop();
    }

    if (!fs.existsSync(this.llamaServerPath)) {
      throw new Error(`llama-server not found at: ${this.llamaServerPath}`);
    }

    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file not found at: ${modelPath}`);
    }

    console.log(`[LlamaManager] Starting llama-server with model: ${modelPath}`);

    return new Promise((resolve, reject) => {
      let started = false;
      let stderrOutput = '';

      try {
        this.process = spawn(this.llamaServerPath, [
          '-m', modelPath,
          '--port', String(this.port),
          '--ctx-size', '32768'
        ], {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        this.currentModel = path.basename(modelPath, path.extname(modelPath));
        this.startTime = Date.now();

        this.process.stdout?.on('data', (data: Buffer) => {
          const output = data.toString();
          console.log('[LlamaManager]', output);
          if ((output.includes('listening on') || output.includes('server is listening')) && !started) {
            started = true;
            console.log('[LlamaManager] Server is ready');
            resolve();
          }
        });

        this.process.stderr?.on('data', (data: Buffer) => {
          const output = data.toString();
          stderrOutput += output;
          console.log('[LlamaManager]', output);
          if ((output.includes('listening on') || output.includes('server is listening')) && !started) {
            started = true;
            console.log('[LlamaManager] Server is ready');
            resolve();
          }
        });

        this.process.on('error', (error) => {
          console.error('[LlamaManager] Process error:', error);
          this.process = null;
          if (!started) {
            started = true;
            reject(error);
          }
        });

        this.process.on('exit', (code, signal) => {
          console.log(`[LlamaManager] Process exited with code ${code}, signal ${signal}`);
          this.process = null;
          this.startTime = 0;
          if (!started) {
            started = true;
            const errorMsg = stderrOutput.trim() || `Process exited with code ${code}`;
            reject(new Error(errorMsg));
          }
        });

        setTimeout(() => {
          if (!started) {
            started = true;
            console.log('[LlamaManager] Server started (timeout reached)');
            resolve();
          }
        }, 15000);

      } catch (error) {
        if (!started) {
          started = true;
          reject(error);
        }
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    console.log('[LlamaManager] Stopping llama-server...');

    return new Promise((resolve) => {
      const process = this.process;
      if (!process) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        console.log('[LlamaManager] Force killing process...');
        try {
          process.kill('SIGKILL');
        } catch (e) {
          // Process already dead
        }
        this.process = null;
        resolve();
      }, 5000);

      process.on('exit', () => {
        clearTimeout(timeout);
        this.process = null;
        console.log('[LlamaManager] Server stopped');
        resolve();
      });

      try {
        process.kill('SIGTERM');
      } catch (error) {
        clearTimeout(timeout);
        this.process = null;
        resolve();
      }
    });
  }

  async restart(modelPath: string): Promise<void> {
    await this.stop();
    await this.start(modelPath);
  }

  async switchModel(newModelPath: string): Promise<void> {
    console.log(`[LlamaManager] Switching model to: ${newModelPath}`);
    await this.restart(newModelPath);
  }

  async waitForReady(timeout: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const healthy = await this.healthCheck();
        if (healthy) {
          return true;
        }
      } catch (e) {
        // Not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }

  async healthCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${this.port}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve(res.statusCode === 200);
        });
      });

      req.on('error', () => {
        resolve(false);
      });

      req.setTimeout(2000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }
}
