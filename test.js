const { Agent, MemoryManager, ModelManager } = require('./packages/core/dist/index');

// 测试MemoryManager
async function testMemoryManager() {
  console.log('=== Test MemoryManager ===\n');

  const memory = new MemoryManager({
    projectMemory: 'test-memory.md',
    sessionCheckpoint: 'test-checkpoint.json',
    scratchNotes: 'test-notes.md',
    taskProgress: 'test-tasks/'
  });

  // 测试保存和加载项目记忆
  console.log('Testing save and load project memory...');
  try {
    await memory.saveProjectMemory('Test project memory content');
    const loaded = await memory.loadProjectMemory();
    console.log('Loaded content:', loaded);
  } catch (error) {
    console.error('Failed to save/load project memory:', error);
  }

  console.log('\n=== MemoryManager Test Complete ===\n');
}

// 测试ModelManager
async function testModelManager() {
  console.log('=== Test ModelManager ===\n');

  const modelManager = new ModelManager();

  // 测试获取提供商列表
  console.log('Testing get providers list...');
  const providers = modelManager.getProviders();
  console.log('Number of providers:', providers.length);

  // 测试获取模型列表
  console.log('\nTesting get models list...');
  const models = modelManager.getModels('ollama');
  console.log('Number of Ollama models:', models.length);

  // 测试设置当前模型
  console.log('\nTesting set current model...');
  modelManager.setCurrentModel('ollama', 'llama3.2');
  const currentModel = modelManager.getCurrentModel();
  console.log('Current model:', currentModel);

  console.log('\n=== ModelManager Test Complete ===\n');
}

// 测试Agent
async function testAgent() {
  console.log('=== Test Agent ===\n');

  const config = {
    id: 'test',
    name: 'Test Agent',
    description: 'Agent for testing',
    systemPrompt: 'You are a test assistant.',
    tools: [],
    memory: {
      projectMemory: 'test-memory.md',
      sessionCheckpoint: 'test-checkpoint.json',
      scratchNotes: 'test-notes.md',
      taskProgress: 'test-tasks/'
    }
  };

  const agent = new Agent(config);

  // 测试获取状态
  console.log('Testing get state...');
  const state = agent.getState();
  console.log('State:', state);

  console.log('\n=== Agent Test Complete ===\n');
}

// 运行所有测试
async function runTests() {
  console.log('Starting tests...\n');

  try {
    await testMemoryManager();
    await testModelManager();
    await testAgent();
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// 运行测试
runTests();
