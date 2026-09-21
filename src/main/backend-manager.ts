import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

export interface BackendStatus {
  running: boolean;
  pid: number | null;
  port: number;
  uptime: number;
}

export class BackendManager {
  private process: ChildProcess | null = null;
  private port: number = 5588;
  private startTime: number = 0;
  private serverPath: string = '';

  constructor() {
    this.serverPath = this.findServer();
  }

  private findServer(): string {
    const possiblePaths = [
      path.join(process.resourcesPath || '', 'server', 'node-server.js'),
      path.join(__dirname, '..', '..', 'server', 'node-server.js'),
      'D:\\003\\agent-z-desktop\\dist\\server\\node-server.js'
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        console.log('[BackendManager] Found server at:', p);
        return p;
      }
    }

    console.warn('[BackendManager] Server not found, using default path');
    return possiblePaths[0];
  }

  setPort(port: number): void {
    this.port = port;
  }

  getPort(): number {
    return this.port;
  }

  getStatus(): BackendStatus {
    return {
      running: this.process !== null && !this.process.killed,
      pid: this.process?.pid || null,
      port: this.port,
      uptime: this.startTime ? Date.now() - this.startTime : 0
    };
  }

  async getStatusAsync(): Promise<BackendStatus> {
    const basic = this.getStatus();
    if (basic.running) return basic;

    const healthy = await this.healthCheck();
    return {
      running: healthy,
      pid: null,
      port: this.port,
      uptime: 0
    };
  }

  async start(): Promise<void> {
    if (this.process && !this.process.killed) {
      console.warn('[BackendManager] Server already running');
      return;
    }

    const healthy = await this.healthCheck();
    if (healthy) {
      console.log('[BackendManager] Server already running on port', this.port);
      return;
    }

    if (!fs.existsSync(this.serverPath)) {
      throw new Error(`Server not found at: ${this.serverPath}`);
    }

    console.log(`[BackendManager] Starting backend server on port ${this.port}`);

    return new Promise((resolve, reject) => {
      try {
        const serverDir = path.dirname(this.serverPath);
        
        this.process = spawn('node', [this.serverPath], {
          cwd: serverDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PORT: String(this.port),
            HOST: '127.0.0.1'
          }
        });

        this.startTime = Date.now();

        this.process.stdout?.on('data', (data: Buffer) => {
          const output = data.toString();
          console.log('[BackendManager]', output);
          if (output.includes('Server running') || output.includes('listening')) {
            console.log('[BackendManager] Server is ready');
            resolve();
          }
        });

        this.process.stderr?.on('data', (data: Buffer) => {
          const output = data.toString();
          console.log('[BackendManager]', output);
          if (output.includes('Server running') || output.includes('listening')) {
            console.log('[BackendManager] Server is ready');
            resolve();
          }
        });

        this.process.on('error', (error) => {
          console.error('[BackendManager] Process error:', error);
          this.process = null;
          reject(error);
        });

        this.process.on('exit', (code, signal) => {
          console.log(`[BackendManager] Process exited with code ${code}, signal ${signal}`);
          this.process = null;
          this.startTime = 0;
        });

        setTimeout(() => {
          if (this.process && !this.process.killed) {
            console.log('[BackendManager] Server started (timeout reached)');
            resolve();
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    console.log('[BackendManager] Stopping backend server...');

    return new Promise((resolve) => {
      const process = this.process;
      if (!process) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        console.log('[BackendManager] Force killing process...');
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
        console.log('[BackendManager] Server stopped');
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

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
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
      const req = http.get(`http://127.0.0.1:${this.port}/api/status`, (res) => {
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
