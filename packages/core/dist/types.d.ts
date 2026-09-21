export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    tools: Tool[];
    memory?: MemoryConfig;
}
export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (params: Record<string, unknown>) => Promise<unknown>;
}
export interface MemoryConfig {
    projectMemory: string;
    sessionCheckpoint: string;
    scratchNotes: string;
    taskProgress: string;
}
export interface Checkpoint {
    currentIntent: string;
    nextAction: string;
    workingConstraints: string[];
    taskTree: TaskNode;
    currentWork: string;
    involvedFiles: string[];
    crossTaskDiscoveries: string[];
    errorsAndFixes: Error[];
    runtimeState: RuntimeState;
    designDecisions: Decision[];
    miscNotes: string;
}
export interface TaskNode {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    children: TaskNode[];
    progress: number;
}
export interface RuntimeState {
    contextUsage: number;
    tokenCount: number;
    lastCheckpoint: Date;
    cycleCount: number;
}
export interface Decision {
    timestamp: Date;
    decision: string;
    reasoning: string;
    alternatives: string[];
}
export interface ContextBudget {
    checkpoint: number;
    memory: number;
    notes: number;
    recentMessages: number;
    total: number;
}
export interface ModelProvider {
    id: string;
    name: string;
    type: 'local' | 'cloud' | 'custom';
    baseURL: string;
    apiKey?: string;
    models: Model[];
}
export interface Model {
    id: string;
    name: string;
    contextWindow: number;
    capabilities: string[];
}
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
export interface ConversationState {
    messages: Message[];
    contextUsage: number;
    tokenCount: number;
    cycleCount: number;
}
//# sourceMappingURL=types.d.ts.map