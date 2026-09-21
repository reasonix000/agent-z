import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

interface Config {
  models: {
    folderPath: string;
    selectedModel: string;
    autoDetect: boolean;
    lastScan: string | null;
  };
  llama: {
    port: number;
    ctxSize: number;
    autoStart: boolean;
  };
  server: {
    port: number;
    host: string;
  };
  ui: {
    theme: 'dark' | 'light' | 'system';
    language: string;
  };
}

const defaultConfig: Config = {
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

export class ConfigManager {
  private config: Config;
  private configPath: string;

  constructor() {
    this.config = { ...defaultConfig };
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'config.json');
  }

  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const saved = JSON.parse(data);
        this.config = this.mergeConfig(defaultConfig, saved);
      }
    } catch (error) {
      console.error('[Config] Failed to load config:', error);
      this.config = { ...defaultConfig };
    }
  }

  async save(): Promise<void> {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('[Config] Failed to save config:', error);
    }
  }

  get<K extends keyof Config>(key: K): Config[K];
  get(key: string): unknown;
  get(key: string): unknown {
    const keys = key.split('.');
    let value: unknown = this.config;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }
    return value;
  }

  set<K extends keyof Config>(key: K, value: Config[K]): void;
  set(key: string, value: unknown): void;
  set(key: string, value: unknown): void {
    const keys = key.split('.');
    let target = this.config as unknown as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k] as Record<string, unknown>;
    }
    target[keys[keys.length - 1]] = value;
    this.save();
  }

  getAll(): Config {
    return { ...this.config };
  }

  reset(): void {
    this.config = { ...defaultConfig };
    this.save();
  }

  private mergeConfig(defaults: Config, saved: Partial<Config>): Config {
    const result = { ...defaults };
    for (const key of Object.keys(saved) as Array<keyof Config>) {
      if (saved[key] !== undefined) {
        if (typeof saved[key] === 'object' && saved[key] !== null && !Array.isArray(saved[key])) {
          (result as Record<string, unknown>)[key] = {
            ...(defaults[key] as object),
            ...(saved[key] as object)
          };
        } else {
          (result as Record<string, unknown>)[key] = saved[key];
        }
      }
    }
    return result;
  }
}
