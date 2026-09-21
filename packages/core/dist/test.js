"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTests = runTests;
const index_1 = require("./index");
// 测试Agent
async function testAgent() {
    console.log('=== 测试Agent ===\n');
    // 创建Agent配置
    const config = {
        id: 'test',
        name: '测试Agent',
        description: '用于测试的Agent',
        systemPrompt: '你是一个测试助手。',
        tools: [],
        memory: {
            projectMemory: 'test-memory.md',
            sessionCheckpoint: 'test-checkpoint.json',
            scratchNotes: 'test-notes.md',
            taskProgress: 'test-tasks/'
        }
    };
    // 创建Agent实例
    const agent = new index_1.Agent(config);
    // 测试处理消息
    console.log('测试处理消息...');
    try {
        const response = await agent.processMessage('你好！');
        console.log('响应:', response);
    }
    catch (error) {
        console.error('处理消息失败:', error);
    }
    // 测试获取状态
    console.log('\n测试获取状态...');
    const state = agent.getState();
    console.log('状态:', state);
    console.log('\n=== Agent测试完成 ===\n');
}
// 测试MemoryManager
async function testMemoryManager() {
    console.log('=== 测试MemoryManager ===\n');
    // 创建MemoryManager实例
    const memory = new index_1.MemoryManager({
        projectMemory: 'test-memory.md',
        sessionCheckpoint: 'test-checkpoint.json',
        scratchNotes: 'test-notes.md',
        taskProgress: 'test-tasks/'
    });
    // 测试保存和加载项目记忆
    console.log('测试保存和加载项目记忆...');
    try {
        await memory.saveProjectMemory('测试项目记忆内容');
        const loaded = await memory.loadProjectMemory();
        console.log('加载的内容:', loaded);
    }
    catch (error) {
        console.error('保存/加载项目记忆失败:', error);
    }
    console.log('\n=== MemoryManager测试完成 ===\n');
}
// 测试ModelManager
async function testModelManager() {
    console.log('=== 测试ModelManager ===\n');
    // 创建ModelManager实例
    const modelManager = new index_1.ModelManager();
    // 测试获取提供商列表
    console.log('测试获取提供商列表...');
    const providers = modelManager.getProviders();
    console.log('提供商数量:', providers.length);
    // 测试获取模型列表
    console.log('\n测试获取模型列表...');
    const models = modelManager.getModels('ollama');
    console.log('Ollama模型数量:', models.length);
    // 测试设置当前模型
    console.log('\n测试设置当前模型...');
    modelManager.setCurrentModel('ollama', 'llama3.2');
    const currentModel = modelManager.getCurrentModel();
    console.log('当前模型:', currentModel);
    console.log('\n=== ModelManager测试完成 ===\n');
}
// 运行所有测试
async function runTests() {
    console.log('开始运行测试...\n');
    try {
        await testMemoryManager();
        await testModelManager();
        await testAgent();
        console.log('所有测试完成！');
    }
    catch (error) {
        console.error('测试过程中出错:', error);
    }
}
// 如果直接运行此文件，则执行测试
if (require.main === module) {
    runTests();
}
//# sourceMappingURL=test.js.map