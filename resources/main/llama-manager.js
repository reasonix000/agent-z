"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlamaManager = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const http = __importStar(require("http"));
class LlamaManager {
    constructor() {
        this.process = null;
        this.port = 8081;
        this.currentModel = '';
        this.startTime = 0;
        this.llamaServerPath = '';
        this.llamaServerPath = this.findLlamaServer();
    }
    findLlamaServer() {
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
    setPort(port) {
        this.port = port;
    }
    getPort() {
        return this.port;
    }
    getStatus() {
        return {
            running: this.process !== null && !this.process.killed,
            pid: this.process?.pid || null,
            model: this.currentModel,
            port: this.port,
            uptime: this.startTime ? Date.now() - this.startTime : 0
        };
    }
    async start(modelPath) {
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
                this.process = (0, child_process_1.spawn)(this.llamaServerPath, [
                    '-m', modelPath,
                    '--port', String(this.port),
                    '--ctx-size', '32768'
                ], {
                    stdio: ['ignore', 'pipe', 'pipe']
                });
                this.currentModel = path.basename(modelPath, path.extname(modelPath));
                this.startTime = Date.now();
                this.process.stdout?.on('data', (data) => {
                    const output = data.toString();
                    console.log('[LlamaManager]', output);
                    if ((output.includes('listening on') || output.includes('server is listening')) && !started) {
                        started = true;
                        console.log('[LlamaManager] Server is ready');
                        resolve();
                    }
                });
                this.process.stderr?.on('data', (data) => {
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
            }
            catch (error) {
                if (!started) {
                    started = true;
                    reject(error);
                }
            }
        });
    }
    async stop() {
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
                }
                catch (e) {
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
            }
            catch (error) {
                clearTimeout(timeout);
                this.process = null;
                resolve();
            }
        });
    }
    async restart(modelPath) {
        await this.stop();
        await this.start(modelPath);
    }
    async switchModel(newModelPath) {
        console.log(`[LlamaManager] Switching model to: ${newModelPath}`);
        await this.restart(newModelPath);
    }
    async waitForReady(timeout = 30000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            try {
                const healthy = await this.healthCheck();
                if (healthy) {
                    return true;
                }
            }
            catch (e) {
                // Not ready yet
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return false;
    }
    async healthCheck() {
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
exports.LlamaManager = LlamaManager;
//# sourceMappingURL=llama-manager.js.map