"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelManager = void 0;
class ModelManager {
    providers = new Map();
    currentProvider = '';
    currentModel = '';
    constructor() {
        this.loadDefaultProviders();
    }
    loadDefaultProviders() {
        // Ollama本地模型
        this.providers.set('ollama', {
            id: 'ollama',
            name: 'Ollama',
            type: 'local',
            baseURL: 'http://localhost:11434',
            models: [
                {
                    id: 'llama3.2',
                    name: 'Llama 3.2',
                    contextWindow: 128000,
                    capabilities: ['text', 'code']
                },
                {
                    id: 'qwen2.5',
                    name: 'Qwen 2.5',
                    contextWindow: 128000,
                    capabilities: ['text', 'code']
                },
                {
                    id: 'deepseek-v4',
                    name: 'DeepSeek V4',
                    contextWindow: 1000000,
                    capabilities: ['text', 'code', 'reasoning']
                }
            ]
        });
        // GLM云端模型
        this.providers.set('glm', {
            id: 'glm',
            name: '智谱GLM',
            type: 'cloud',
            baseURL: 'https://open.bigmodel.cn/api/paas/v4',
            models: [
                {
                    id: 'glm-4.5-flash',
                    name: 'GLM-4.5-Flash（免费）',
                    contextWindow: 128000,
                    capabilities: ['text', 'code', 'vision']
                },
                {
                    id: 'glm-5.2',
                    name: 'GLM-5.2',
                    contextWindow: 128000,
                    capabilities: ['text', 'code', 'vision']
                }
            ]
        });
    }
    async addProvider(provider) {
        this.providers.set(provider.id, provider);
    }
    async removeProvider(providerId) {
        this.providers.delete(providerId);
    }
    getProviders() {
        return Array.from(this.providers.values());
    }
    getModels(providerId) {
        const provider = this.providers.get(providerId);
        return provider ? provider.models : [];
    }
    setCurrentModel(providerId, modelId) {
        this.currentProvider = providerId;
        this.currentModel = modelId;
    }
    getCurrentModel() {
        return {
            provider: this.currentProvider,
            model: this.currentModel
        };
    }
    async generate(prompt) {
        const provider = this.providers.get(this.currentProvider);
        if (!provider) {
            throw new Error(`Provider ${this.currentProvider} not found`);
        }
        // 根据提供商类型调用不同的API
        switch (provider.type) {
            case 'local':
                return await this.generateWithOllama(provider, prompt);
            case 'cloud':
                return await this.generateWithGLM(provider, prompt);
            case 'custom':
                return await this.generateWithCustomAPI(provider, prompt);
            default:
                throw new Error(`Unsupported provider type: ${provider.type}`);
        }
    }
    async generateWithOllama(provider, prompt) {
        const response = await fetch(`${provider.baseURL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.currentModel,
                prompt: prompt,
                stream: false
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.response;
    }
    async generateWithGLM(provider, prompt) {
        const response = await fetch(`${provider.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: this.currentModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });
        if (!response.ok) {
            throw new Error(`GLM API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
    async generateWithCustomAPI(provider, prompt) {
        const response = await fetch(`${provider.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: this.currentModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });
        if (!response.ok) {
            throw new Error(`Custom API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
    async checkProviderHealth(providerId) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            return false;
        }
        try {
            if (provider.type === 'local') {
                const response = await fetch(`${provider.baseURL}/api/tags`);
                return response.ok;
            }
            // 对于云端API，可以尝试一个简单的请求
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async listAvailableModels() {
        const availableModels = [];
        for (const [providerId, provider] of this.providers) {
            const isHealthy = await this.checkProviderHealth(providerId);
            if (isHealthy) {
                for (const model of provider.models) {
                    availableModels.push({
                        provider: providerId,
                        model: model
                    });
                }
            }
        }
        return availableModels;
    }
}
exports.ModelManager = ModelManager;
//# sourceMappingURL=index.js.map