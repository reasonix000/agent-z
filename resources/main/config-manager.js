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
exports.ConfigManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const defaultConfig = {
    models: {
        folderPath: '',
        selectedModel: '',
        autoDetect: true,
        lastScan: null
    },
    llama: {
        port: 8081,
        ctxSize: 32768,
        autoStart: true
    },
    server: {
        port: 5588,
        host: '127.0.0.1'
    },
    ui: {
        theme: 'dark',
        language: 'zh-CN'
    }
};
class ConfigManager {
    constructor() {
        this.config = { ...defaultConfig };
        const userDataPath = electron_1.app.getPath('userData');
        this.configPath = path.join(userDataPath, 'config.json');
    }
    async load() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf-8');
                const saved = JSON.parse(data);
                this.config = this.mergeConfig(defaultConfig, saved);
            }
        }
        catch (error) {
            console.error('[Config] Failed to load config:', error);
            this.config = { ...defaultConfig };
        }
    }
    async save() {
        try {
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('[Config] Failed to save config:', error);
        }
    }
    get(key) {
        const keys = key.split('.');
        let value = this.config;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
    set(key, value) {
        const keys = key.split('.');
        let target = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in target) || typeof target[k] !== 'object') {
                target[k] = {};
            }
            target = target[k];
        }
        target[keys[keys.length - 1]] = value;
        this.save();
    }
    getAll() {
        return { ...this.config };
    }
    reset() {
        this.config = { ...defaultConfig };
        this.save();
    }
    mergeConfig(defaults, saved) {
        const result = { ...defaults };
        for (const key of Object.keys(saved)) {
            if (saved[key] !== undefined) {
                if (typeof saved[key] === 'object' && saved[key] !== null && !Array.isArray(saved[key])) {
                    result[key] = {
                        ...defaults[key],
                        ...saved[key]
                    };
                }
                else {
                    result[key] = saved[key];
                }
            }
        }
        return result;
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config-manager.js.map