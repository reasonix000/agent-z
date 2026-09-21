import { MemoryConfig, Checkpoint, Message } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class MemoryManager {
  private config?: MemoryConfig;
  private projectRoot: string;

  constructor(config?: MemoryConfig, projectRoot?: string) {
    this.config = config;
    this.projectRoot = projectRoot || process.cwd();
  }

  async loadProjectMemory(): Promise<string> {
    if (!this.config) return '';

    const memoryPath = path.join(this.projectRoot, this.config.projectMemory);
    try {
      if (fs.existsSync(memoryPath)) {
        return fs.readFileSync(memoryPath, 'utf-8');
      }
    } catch (error) {
      console.error('加载项目记忆失败:', error);
    }
    return '';
  }

  async saveProjectMemory(content: string): Promise<void> {
    if (!this.config) return;

    const memoryPath = path.join(this.projectRoot, this.config.projectMemory);
    try {
      const dir = path.dirname(memoryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(memoryPath, content, 'utf-8');
    } catch (error) {
      console.error('保存项目记忆失败:', error);
    }
  }

  async loadCheckpoint(): Promise<Checkpoint | null> {
    if (!this.config) return null;

    const checkpointPath = path.join(this.projectRoot, this.config.sessionCheckpoint);
    try {
      if (fs.existsSync(checkpointPath)) {
        const content = fs.readFileSync(checkpointPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('加载检查点失败:', error);
    }
    return null;
  }

  async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    if (!this.config) return;

    const checkpointPath = path.join(this.projectRoot, this.config.sessionCheckpoint);
    try {
      const dir = path.dirname(checkpointPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存检查点失败:', error);
    }
  }

  async loadNotes(): Promise<string> {
    if (!this.config) return '';

    const notesPath = path.join(this.projectRoot, this.config.scratchNotes);
    try {
      if (fs.existsSync(notesPath)) {
        return fs.readFileSync(notesPath, 'utf-8');
      }
    } catch (error) {
      console.error('加载笔记失败:', error);
    }
    return '';
  }

  async saveNotes(content: string): Promise<void> {
    if (!this.config) return;

    const notesPath = path.join(this.projectRoot, this.config.scratchNotes);
    try {
      const dir = path.dirname(notesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(notesPath, content, 'utf-8');
    } catch (error) {
      console.error('保存笔记失败:', error);
    }
  }

  async loadTaskProgress(taskId: string): Promise<string> {
    if (!this.config) return '';

    const progressPath = path.join(this.projectRoot, this.config.taskProgress, taskId, 'progress.md');
    try {
      if (fs.existsSync(progressPath)) {
        return fs.readFileSync(progressPath, 'utf-8');
      }
    } catch (error) {
      console.error('加载任务进度失败:', error);
    }
    return '';
  }

  async saveTaskProgress(taskId: string, progress: string): Promise<void> {
    if (!this.config) return;

    const progressPath = path.join(this.projectRoot, this.config.taskProgress, taskId, 'progress.md');
    try {
      const dir = path.dirname(progressPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(progressPath, progress, 'utf-8');
    } catch (error) {
      console.error('保存任务进度失败:', error);
    }
  }

  async consolidateMemory(messages: Message[]): Promise<void> {
    // 合并历史会话，去重冗余信息
    const projectMemory = await this.loadProjectMemory();
    
    // 从对话中提取关键信息
    const keyInformation = this.extractKeyInformation(messages);
    
    // 合并到项目记忆
    const consolidatedMemory = this.mergeMemory(projectMemory, keyInformation);
    
    // 保存更新后的项目记忆
    await this.saveProjectMemory(consolidatedMemory);
  }

  private extractKeyInformation(messages: Message[]): string {
    // 从对话中提取关键信息
    const keyPoints: string[] = [];
    
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

  private mergeMemory(existingMemory: string, newInformation: string): string {
    // 合并现有记忆和新信息
    const timestamp = new Date().toISOString();
    const newSection = `\n\n## 更新于 ${timestamp}\n${newInformation}`;
    
    return existingMemory + newSection;
  }

  async validateFilePaths(): Promise<void> {
    // 验证文件路径有效性
    if (!this.config) return;

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

  async cleanupOldCheckpoints(keepCount: number = 5): Promise<void> {
    // 清理旧的检查点文件
    if (!this.config) return;

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
    } catch (error) {
      console.error('清理检查点失败:', error);
    }
  }
}
