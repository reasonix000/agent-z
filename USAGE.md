# 智能体Z (Agent-Z) 使用说明

## 快速开始

### 1. 安装依赖

```bash
# 进入项目目录
cd D:\003\agent-z

# 安装依赖
npm install
```

### 2. 编译项目

```bash
# 编译核心模块
cd packages\core
npm run build

# 返回项目根目录
cd ..
```

### 3. 运行测试

```bash
# 运行测试脚本
node test.js
```

### 4. 启动CLI

```bash
# 启动智能体Z命令行界面
node packages\core\dist\cli.js
```

## 命令列表

- `/z` - 触发记忆整合，重建上下文
- `/dream` - 扫描历史会话，提取持久知识（尚未实现）
- `/distill` - 发现重复工作流，打包为可复用技能（尚未实现）
- `/context-limit` - 设置上下文压缩阈值（尚未实现）
- `/goal` - 设置停止条件（尚未实现）
- `/status` - 显示当前状态
- `/help` - 显示帮助信息
- `/exit` - 退出程序

## 配置文件

配置文件位于 `.agent-z/config.json`：

```json
{
  "id": "default",
  "name": "智能体Z",
  "description": "具备持久记忆、无限上下文、双Agent协作架构的智能开发助手",
  "systemPrompt": "你是软件技术栈工程助手，用中文对话回复，以逻辑推理为主解决实际开源技术工程架构项目。",
  "tools": [],
  "memory": {
    "projectMemory": "MEMORY.md",
    "sessionCheckpoint": "checkpoint.md",
    "scratchNotes": "notes.md",
    "taskProgress": "tasks/"
  }
}
```

## 记忆系统

智能体Z使用四层记忆结构：

1. **项目记忆 (MEMORY.md)** - 持久化项目知识、规则和架构决策
2. **会话检查点 (checkpoint.md)** - 结构化状态快照
3. **临时笔记 (notes.md)** - Agent临时记录区
4. **任务进度 (tasks/<id>/progress.md)** - 每个任务的独立日志

## 模型接入

### 本地Ollama

确保Ollama正在运行：

```bash
ollama serve
```

智能体Z会自动检测并连接到 `http://localhost:11434`。

### 云端GLM

在配置文件中添加GLM API密钥：

```json
{
  "provider": {
    "glm": {
      "baseURL": "https://open.bigmodel.cn/api/paas/v4",
      "apiKey": "YOUR_API_KEY"
    }
  }
}
```

## 上下文管理

智能体Z会自动管理上下文：

- 当上下文使用率达到20%、45%、70%时，自动创建检查点
- 当上下文使用率达到95%时，自动重建上下文
- 使用 `/z` 命令手动触发记忆整合

## 项目结构

```
agent-z/
├── packages/
│   ├── core/                 # 核心Agent模块
│   │   ├── src/
│   │   │   ├── agents/       # Agent实现
│   │   │   ├── memory/       # 记忆系统
│   │   │   ├── models/       # 模型管理
│   │   │   └── cli.ts        # CLI入口
│   │   └── package.json
│   ├── tui/                  # 终端界面（待实现）
│   └── web/                  # Web状态看板（待实现）
├── test.js                   # 测试脚本
└── README.md                 # 本文件
```

## 下一步开发

1. **TUI界面**: 实现终端用户界面
2. **Web状态看板**: 实现实时进度显示
3. **多平台编译**: 支持Windows/Linux/FreeBSD
4. **更多命令**: 实现/dream、/distill等命令

## 故障排除

### 问题：编译失败

确保已安装所有依赖：

```bash
npm install
```

### 问题：无法连接Ollama

确保Ollama正在运行：

```bash
ollama serve
```

### 问题：中文显示乱码

在Windows上，可能需要设置UTF-8编码：

```powershell
chcp 65001
```

## 许可证

MIT License
