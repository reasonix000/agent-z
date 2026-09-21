import * as fs from 'fs';
import * as path from 'path';

export interface ModelInfo {
  name: string;
  fileName: string;
  filePath: string;
  size: number;
  sizeFormatted: string;
  lastModified: Date;
  isSelected: boolean;
}

export class ModelScanner {
  private folderPath: string = '';
  private cachedModels: ModelInfo[] = [];
  private selectedModel: string = '';

  setFolder(folderPath: string): void {
    this.folderPath = folderPath;
  }

  getFolder(): string {
    return this.folderPath;
  }

  setSelectedModel(modelName: string): void {
    this.selectedModel = modelName;
    this.cachedModels.forEach(m => {
      m.isSelected = m.fileName === modelName;
    });
  }

  getCachedModels(): ModelInfo[] {
    return this.cachedModels;
  }

  async scan(): Promise<ModelInfo[]> {
    if (!this.folderPath || !fs.existsSync(this.folderPath)) {
      console.warn('[ModelScanner] Folder not found:', this.folderPath);
      return [];
    }

    const models: ModelInfo[] = [];

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
          } catch (error) {
            console.warn('[ModelScanner] Failed to read file stats:', file, error);
          }
        }
      }

      models.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      this.cachedModels = models;
      
      console.log(`[ModelScanner] Found ${models.length} models in ${this.folderPath}`);
    } catch (error) {
      console.error('[ModelScanner] Scan failed:', error);
    }

    return models;
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    
    return `${size} ${units[i]}`;
  }
}
