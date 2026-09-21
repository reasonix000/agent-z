import { MemoryConfig, Checkpoint, Message } from '../types';
export declare class MemoryManager {
    private config?;
    private projectRoot;
    constructor(config?: MemoryConfig, projectRoot?: string);
    loadProjectMemory(): Promise<string>;
    saveProjectMemory(content: string): Promise<void>;
    loadCheckpoint(): Promise<Checkpoint | null>;
    saveCheckpoint(checkpoint: Checkpoint): Promise<void>;
    loadNotes(): Promise<string>;
    saveNotes(content: string): Promise<void>;
    loadTaskProgress(taskId: string): Promise<string>;
    saveTaskProgress(taskId: string, progress: string): Promise<void>;
    consolidateMemory(messages: Message[]): Promise<void>;
    private extractKeyInformation;
    private mergeMemory;
    validateFilePaths(): Promise<void>;
    cleanupOldCheckpoints(keepCount?: number): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map