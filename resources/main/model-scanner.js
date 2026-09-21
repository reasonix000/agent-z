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
exports.ModelScanner = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ModelScanner {
    constructor() {
        this.folderPath = '';
        this.cachedModels = [];
        this.selectedModel = '';
    }
    setFolder(folderPath) {
        this.folderPath = folderPath;
    }
    getFolder() {
        return this.folderPath;
    }
    setSelectedModel(modelName) {
        this.selectedModel = modelName;
        this.cachedModels.forEach(m => {
            m.isSelected = m.fileName === modelName;
        });
    }
    getCachedModels() {
        return this.cachedModels;
    }
    async scan() {
        if (!this.folderPath || !fs.existsSync(this.folderPath)) {
            console.warn('[ModelScanner] Folder not found:', this.folderPath);
            return [];
        }
        const models = [];
        try {
            const files = fs.readdirSync(this.folderPath);
            for (const file of files) {
                if (path.extname(file).toLowerCase() === '.gguf') {
                    const filePath = path.join(this.folderPath, file);
                    try {
                        const stats = fs.statSync(filePath);
                        if (stats.isFile()) {
                            const name = path.basename(file, '.gguf');
                            models.push({
                                name,
                                fileName: file,
                                filePath,
                                size: stats.size,
                                sizeFormatted: this.formatSize(stats.size),
                                lastModified: stats.mtime,
                                isSelected: file === this.selectedModel
                            });
                        }
                    }
                    catch (error) {
                        console.warn('[ModelScanner] Failed to read file stats:', file, error);
                    }
                }
            }
            models.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
            this.cachedModels = models;
            console.log(`[ModelScanner] Found ${models.length} models in ${this.folderPath}`);
        }
        catch (error) {
            console.error('[ModelScanner] Scan failed:', error);
        }
        return models;
    }
    formatSize(bytes) {
        if (bytes === 0)
            return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
        return `${size} ${units[i]}`;
    }
}
exports.ModelScanner = ModelScanner;
//# sourceMappingURL=model-scanner.js.map