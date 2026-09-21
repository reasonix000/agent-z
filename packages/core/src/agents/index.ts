import { AgentConfig, Message, ConversationState, Checkpoint } from '../types';
import { MemoryManager } from '../memory';
import { ModelManager } from '../models';

export class Agent {
  private config: AgentConfig;
  private memory: MemoryManager;
  private modelManager: ModelManager;
  private state: ConversationState;
  private checkpointThresholds: number[] = [0.2, 0.45, 0.7];

  constructor(config: AgentConfig) {
    this.config = config;
    this.memory = new MemoryManager(config.memory);
    this.modelManager = new ModelManager();
    this.state = {
      messages: [],
      contextUsage: 0,
      tokenCount: 0,
      cycleCount: 1
    };
  }

  async initialize(): Promise<void> {
    // 加载项目记忆
    const projectMemory = await this.memory.loadProjectMemory();
    if (projectMemory) {
      this.addMessage({
        role: 'system',
        content: `项目记忆:\n${projectMemory}`,
        timestamp: new Date()
      });
    }

    // 加载会话检查点
    const checkpoint = await this.memory.loadCheckpoint();
    if (checkpoint) {
      this.restoreFromCheckpoint(checkpoint);
    }
  }

  async processMessage(userMessage: string): Promise<string> {
    // 添加用户消息
    this.addMessage({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    // 检查是否需要创建检查点
    await this.checkAndCreateCheckpoint();

    // 生成响应
    const response = await this.generateResponse();

    // 添加助手响应
    this.addMessage({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    // 更新上下文使用率
    this.updateContextUsage();

    return response;
  }

  private addMessage(message: Message): void {
    this.state.messages.push(message);
    this.updateTokenCount();
  }

  private updateTokenCount(): void {
    // 简化的token计数（实际应该使用tokenizer）
    this.state.tokenCount = this.state.messages.reduce((total, msg) => {
      return total + msg.content.length;
    }, 0);
  }

  private updateContextUsage(): void {
    // 假设最大上下文为128K tokens
    const maxContext = 128000;
    this.state.contextUsage = this.state.tokenCount / maxContext;
  }

  private async checkAndCreateCheckpoint(): Promise<void> {
    // 检查是否达到检查点阈值
    for (const threshold of this.checkpointThresholds) {
      if (this.state.contextUsage >= threshold) {
        await this.createCheckpoint();
        break;
      }
    }

    // 检查是否需要进行上下文重建（/z命令）
    if (this.state.contextUsage >= 0.95) {
      await this.rebuildContext();
    }
  }

  private async createCheckpoint(): Promise<void> {
    const checkpoint: Checkpoint = {
      currentIntent: this.extractCurrentIntent(),
      nextAction: this.extractNextAction(),
      workingConstraints: [],
      taskTree: {
        id: 'root',
        name: '主任务',
        status: 'in_progress',
        children: [],
        progress: Math.floor(this.state.contextUsage * 100)
      },
      currentWork: this.extractCurrentWork(),
      involvedFiles: [],
      crossTaskDiscoveries: [],
      errorsAndFixes: [],
      runtimeState: {
        contextUsage: this.state.contextUsage,
        tokenCount: this.state.tokenCount,
        lastCheckpoint: new Date(),
        cycleCount: this.state.cycleCount
      },
      designDecisions: [],
      miscNotes: ''
    };

    await this.memory.saveCheckpoint(checkpoint);
    this.state.cycleCount++;
  }

  private async rebuildContext(): Promise<void> {
    // 保存当前检查点
    await this.createCheckpoint();

    // 加载最新的检查点
    const checkpoint = await this.memory.loadCheckpoint();
    if (checkpoint) {
      // 重建上下文
      this.state.messages = [
        {
          role: 'system',
          content: `上下文已重建。检查点信息:\n意图: ${checkpoint.currentIntent}\n下一步: ${checkpoint.nextAction}\n进度: ${checkpoint.taskTree.progress}%`,
          timestamp: new Date()
        }
      ];
      this.state.contextUsage = 0.1; // 重置上下文使用率
    }
  }

  private extractCurrentIntent(): string {
    // 从对话中提取当前意图
    const lastUserMessage = this.state.messages
      .filter(m => m.role === 'user')
      .pop();
    return lastUserMessage?.content || '处理用户请求';
  }

  private extractNextAction(): string {
    // 从对话中提取下一步操作
    return '继续执行任务';
  }

  private extractCurrentWork(): string {
    // 从对话中提取当前工作内容
    const lastAssistantMessage = this.state.messages
      .filter(m => m.role === 'assistant')
      .pop();
    return lastAssistantMessage?.content || '';
  }

  private restoreFromCheckpoint(checkpoint: Checkpoint): void {
    // 从检查点恢复状态
    this.state.contextUsage = checkpoint.runtimeState.contextUsage;
    this.state.tokenCount = checkpoint.runtimeState.tokenCount;
    this.state.cycleCount = checkpoint.runtimeState.cycleCount;
  }

  private async generateResponse(): Promise<string> {
    // 构建提示词
    const prompt = this.buildPrompt();

    // 调用模型生成响应
    const response = await this.modelManager.generate(prompt);

    return response;
  }

  private buildPrompt(): string {
    // 构建包含系统提示和对话历史的提示词
    const systemPrompt = this.config.systemPrompt;
    const conversationHistory = this.state.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `${systemPrompt}\n\n对话历史:\n${conversationHistory}`;
  }

  // /z命令处理
  async handleZCommand(): Promise<string> {
    // 执行记忆整合
    await this.memory.consolidateMemory(this.state.messages);

    // 重建上下文
    await this.rebuildContext();

    return '记忆整合完成。上下文已重建。';
  }

  // 获取状态
  getState(): ConversationState {
    return { ...this.state };
  }

  // 获取配置
  getConfig(): AgentConfig {
    return { ...this.config };
  }
}
