import { ModelProvider, Model } from '../types';
export declare class ModelManager {
    private providers;
    private currentProvider;
    private currentModel;
    constructor();
    private loadDefaultProviders;
    addProvider(provider: ModelProvider): Promise<void>;
    removeProvider(providerId: string): Promise<void>;
    getProviders(): ModelProvider[];
    getModels(providerId: string): Model[];
    setCurrentModel(providerId: string, modelId: string): void;
    getCurrentModel(): {
        provider: string;
        model: string;
    };
    generate(prompt: string): Promise<string>;
    private generateWithOllama;
    private generateWithGLM;
    private generateWithCustomAPI;
    checkProviderHealth(providerId: string): Promise<boolean>;
    listAvailableModels(): Promise<{
        provider: string;
        model: Model;
    }[]>;
}
//# sourceMappingURL=index.d.ts.map