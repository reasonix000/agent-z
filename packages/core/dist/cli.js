#!/usr/bin/env node
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
const agents_1 = require("./agents");
const readline = __importStar(require("readline"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// 配置文件路径
const CONFIG_PATH = path.join(process.cwd(), '.agent-z', 'config.json');
// 默认配置
const DEFAULT_CONFIG = {
    id: 'default',
    name: '智能体Z',
    description: '具备持久记忆、无限上下文、双Agent协作架构的智能开发助手',
    systemPrompt: '你是软件技术栈工程助手，用中文对话回复，以逻辑推理为主解决实际开源技术工程架构项目。',
    tools: [],
    memory: {
        projectMemory: 'MEMORY.md',
        sessionCheckpoint: 'checkpoint.md',
        scratchNotes: 'notes.md',
        taskProgress: 'tasks/'
    }
};
// 加载配置
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const configContent = fs.readFileSync(CONFIG_PATH, 'utf-8');
            return { ...DEFAULT_CONFIG, ...JSON.parse(configContent) };
        }
    }
    catch (error) {
        console.error('加载配置失败:', error);
    }
    return DEFAULT_CONFIG;
}
// 保存配置
function saveConfig(config) {
    try {
        const configDir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('保存配置失败:', error);
    }
}
// 显示帮助信息
function showHelp() {
    console.log(`
智能体Z (Agent-Z) - 具备持久记忆、无限上下文、双Agent协作架构的智能开发助手

命令:
  /z          - 触发记忆整合，重建上下文
  /dream      - 扫描历史会话，提取持久知识
  /distill    - 发现重复工作流，打包为可复用技能
  /context-limit - 设置上下文压缩阈值
  /goal       - 设置停止条件
  /help       - 显示此帮助信息
  /exit       - 退出程序

使用方法:
  直接输入消息与智能体Z对话
  输入 /z 命令触发记忆整合
  输入 /help 查看所有命令
  `);
}
// 显示状态
function showStatus(agent) {
    const state = agent.getState();
    console.log(`
当前状态:
  上下文使用率: ${(state.contextUsage * 100).toFixed(1)}%
  Token数量: ${state.tokenCount}
  周期数: ${state.cycleCount}
  消息数量: ${state.messages.length}
  `);
}
// 主函数
async function main() {
    console.log('智能体Z (Agent-Z) 启动中...');
    console.log('正在初始化...\n');
    // 加载配置
    const config = loadConfig();
    // 创建Agent实例
    const agent = new agents_1.Agent(config);
    // 初始化Agent
    await agent.initialize();
    console.log('初始化完成！');
    console.log('输入 /help 查看命令列表');
    console.log('输入消息开始对话\n');
    // 创建readline接口
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });
    // 显示提示符
    rl.prompt();
    // 处理用户输入
    rl.on('line', async (line) => {
        const input = line.trim();
        if (!input) {
            rl.prompt();
            return;
        }
        // 处理命令
        if (input.startsWith('/')) {
            const command = input.split(' ')[0].toLowerCase();
            switch (command) {
                case '/z':
                    console.log('\n正在执行记忆整合...');
                    const zResult = await agent.handleZCommand();
                    console.log(zResult);
                    break;
                case '/dream':
                    console.log('\n正在扫描历史会话，提取持久知识...');
                    // TODO: 实现/dream命令
                    console.log('/dream 命令尚未实现');
                    break;
                case '/distill':
                    console.log('\n正在发现重复工作流，打包为可复用技能...');
                    // TODO: 实现/distill命令
                    console.log('/distill 命令尚未实现');
                    break;
                case '/context-limit':
                    console.log('\n设置上下文压缩阈值...');
                    // TODO: 实现/context-limit命令
                    console.log('/context-limit 命令尚未实现');
                    break;
                case '/goal':
                    console.log('\n设置停止条件...');
                    // TODO: 实现/goal命令
                    console.log('/goal 命令尚未实现');
                    break;
                case '/status':
                    showStatus(agent);
                    break;
                case '/help':
                    showHelp();
                    break;
                case '/exit':
                    console.log('\n再见！');
                    rl.close();
                    process.exit(0);
                default:
                    console.log(`\n未知命令: ${command}`);
                    console.log('输入 /help 查看命令列表');
            }
            rl.prompt();
            return;
        }
        // 处理普通消息
        try {
            console.log('\n思考中...');
            const response = await agent.processMessage(input);
            console.log(`\n${response}`);
        }
        catch (error) {
            console.error('\n处理消息时出错:', error);
        }
        rl.prompt();
    });
    // 处理关闭事件
    rl.on('close', () => {
        console.log('\n再见！');
        process.exit(0);
    });
}
// 运行主函数
main().catch(console.error);
//# sourceMappingURL=cli.js.map