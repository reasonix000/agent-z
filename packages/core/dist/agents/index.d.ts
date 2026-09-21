import { AgentConfig, ConversationState } from '../types';
export declare class Agent {
    private config;
    private memory;
    private modelManager;
    private state;
    private checkpointThresholds;
    constructor(config: AgentConfig);
    initialize(): Promise<void>;
    processMessage(userMessage: string): Promise<string>;
    private addMessage;
    private updateTokenCount;
    private updateContextUsage;
    private checkAndCreateCheckpoint;
    private createCheckpoint;
    private rebuildContext;
    private extractCurrentIntent;
    private extractNextAction;
    private extractCurrentWork;
    private restoreFromCheckpoint;
    private generateResponse;
    private buildPrompt;
    handleZCommand(): Promise<string>;
    getState(): ConversationState;
    getConfig(): AgentConfig;
}
//# sourceMappingURL=index.d.ts.map