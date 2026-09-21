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
exports.BackendManager = void 0;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const http = __importStar(require("http"));
class BackendManager {
    constructor() {
        this.process = null;
        this.port = 5588;
        this.startTime = 0;
        this.serverPath = '';
        this.serverPath = this.findServer();
    }
    findServer() {
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
            port: this.port,
            uptime: this.startTime ? Date.now() - this.startTime : 0
        };
    }
    async getStatusAsync() {
        const basic = this.getStatus();
        if (basic.running)
            return basic;
        const healthy = await this.healthCheck();
        return {
            running: healthy,
            pid: null,
            port: this.port,
            uptime: 0
        };
    }
    async start() {
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
                this.process = (0, child_process_1.spawn)('node', [this.serverPath], {
                    cwd: serverDir,
                    stdio: ['ignore', 'pipe', 'pipe'],
                    env: {
                        ...process.env,
                        PORT: String(this.port),
                        HOST: '127.0.0.1'
                    }
                });
                this.startTime = Date.now();
                this.process.stdout?.on('data', (data) => {
                    const output = data.toString();
                    console.log('[BackendManager]', output);
                    if (output.includes('Server running') || output.includes('listening')) {
                        console.log('[BackendManager] Server is ready');
                        resolve();
                    }
                });
                this.process.stderr?.on('data', (data) => {
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async stop() {
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
                console.log('[BackendManager] Server stopped');
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
    async restart() {
        await this.stop();
        await this.start();
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
exports.BackendManager = BackendManager;
//# sourceMappingURL=backend-manager.js.map