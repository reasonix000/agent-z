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
exports.MemoryManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class MemoryManager {
    config;
    projectRoot;
    constructor(config, projectRoot) {
        this.config = config;
        this.projectRoot = projectRoot || process.cwd();
    }
    async loadProjectMemory() {
        if (!this.config)
            return '';
        const memoryPath = path.join(this.projectRoot, this.config.projectMemory);
        try {
            if (fs.existsSync(memoryPath)) {
                return fs.readFileSync(memoryPath, 'utf-8');
            }
        }
        catch (error) {
            console.error('加载项目记忆失败:', error);
        }
        return '';
    }
    async saveProjectMemory(content) {
        if (!this.config)
            return;
        const memoryPath = path.join(this.projectRoot, this.config.projectMemory);
        try {
            const dir = path.dirname(memoryPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(memoryPath, content, 'utf-8');
        }
        catch (error) {
            console.error('保存项目记忆失败:', error);
        }
    }
    async loadCheckpoint() {
        if (!this.config)
            return null;
        const checkpointPath = path.join(this.projectRoot, this.config.sessionCheckpoint);
        try {
            if (fs.existsSync(checkpointPath)) {
                const content = fs.readFileSync(checkpointPath, 'utf-8');
                return JSON.parse(content);
            }
        }
        catch (error) {
            console.error('加载检查点失败:', error);
        }
        return null;
    }
    async saveCheckpoint(checkpoint) {
        if (!this.config)
            return;
        const checkpointPath = path.join(this.projectRoot, this.config.sessionCheckpoint);
        try {
            const dir = path.dirname(checkpointPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('保存检查点失败:', error);
        }
    }
    async loadNotes() {
        if (!this.config)
            return '';
        const notesPath = path.join(this.projectRoot, this.config.scratchNotes);
        try {
            if (fs.existsSync(notesPath)) {
                return fs.readFileSync(notesPath, 'utf-8');
            }
        }
        catch (error) {
            console.error('加载笔记失败:', error);
        }
        return '';
    }
    async saveNotes(content) {
        if (!this.config)
            return;
        const notesPath = path.join(this.projectRoot, this.config.scratchNotes);
        try {
            const dir = path.dirname(notesPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(notesPath, content, 'utf-8');
        }
        catch (error) {
            console.error('保存笔记失败:', error);
        }
    }
    async loadTaskProgress(taskId) {
        if (!this.config)
            return '';
        const progressPath = path.join(this.projectRoot, this.config.taskProgress, taskId, 'progress.md');
        try {
            if (fs.existsSync(progressPath)) {
                return fs.readFileSync(progressPath, 'utf-8');
            }
        }
        catch (error) {
            console.error('加载任务进度失败:', error);
        }
        return '';
    }
    async saveTaskProgress(taskId, progress) {
        if (!this.config)
            return;
        const progressPath = path.join(this.projectRoot, this.config.taskProgress, taskId, 'progress.md');
        try {
            const dir = path.dirname(progressPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(progressPath, progress, 'utf-8');
        }
        catch (error) {
            console.error('保存任务进度失败:', error);
        }
    }
    async consolidateMemory(messages) {
        // 合并历史会话，去重冗余信息
        const projectMemory = await this.loadProjectMemory();
        // 从对话中提取关键信息
        const keyInformation = this.extractKeyInformation(messages);
        // 合并到项目记忆
        const consolidatedMemory = this.mergeMemory(projectMemory, keyInformation);
        // 保存更新后的项目记忆
        await this.saveProjectMemory(consolidatedMemory);
    }
    extractKeyInformation(messages) {
        // 从对话中提取关键信息
        const keyPoints = [];
        for (const message of messages) {
            if (message.role === 'assistant') {
                // 提取助手响应中的关键信息
                const lines = message.content.split('\n');
                for (const line of lines) {
                    if (line.includes('决策') || line.includes('结论') || line.includes('重要')) {
                        keyPoints.push(line);
                    }
                }
            }
        }
        return keyPoints.join('\n');
    }
    mergeMemory(existingMemory, newInformation) {
        // 合并现有记忆和新信息
        const timestamp = new Date().toISOString();
        const newSection = `\n\n## 更新于 ${timestamp}\n${newInformation}`;
        return existingMemory + newSection;
    }
    async validateFilePaths() {
        // 验证文件路径有效性
        if (!this.config)
            return;
        const paths = [
            this.config.projectMemory,
            this.config.sessionCheckpoint,
            this.config.scratchNotes,
            this.config.taskProgress
        ];
        for (const filePath of paths) {
            const fullPath = path.join(this.projectRoot, filePath);
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    async cleanupOldCheckpoints(keepCount = 5) {
        // 清理旧的检查点文件
        if (!this.config)
            return;
        const checkpointDir = path.join(this.projectRoot, path.dirname(this.config.sessionCheckpoint));
        try {
            if (fs.existsSync(checkpointDir)) {
                const files = fs.readdirSync(checkpointDir)
                    .filter(f => f.startsWith('checkpoint') && f.endsWith('.json'))
                    .sort()
                    .reverse();
                // 保留最新的检查点
                const filesToDelete = files.slice(keepCount);
                for (const file of filesToDelete) {
                    fs.unlinkSync(path.join(checkpointDir, file));
                }
            }
        }
        catch (error) {
            console.error('清理检查点失败:', error);
        }
    }
}
exports.MemoryManager = MemoryManager;
//# sourceMappingURL=index.js.map