# Agent-Z

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows-blueviolet)
![Release](https://img.shields.io/github/v/release/reasonix000/agent-z)

**🚀 智能AI助手桌面应用 - 本地运行，隐私安全**

[快速开始](#快速开始) • [功能特性](#功能特性) • [截图展示](#截图展示) • [下载](#下载)

</div>

---

## 📖 项目介绍

**Agent-Z** 是一款开源的本地AI智能助手桌面应用。它允许您在自己的电脑上直接运行GGUF格式的大语言模型，无需依赖Ollama或其他外部服务，开箱即用。

### 🎯 为什么选择 Agent-Z？

| 特性 | Agent-Z | 其他工具 |
|------|---------|----------|
| **开源协议** | ✅ MIT 开源 | ❌ 多数受限 |
| **Ollama依赖** | ✅ 无需依赖 | ❌ 需要安装 |
| **开箱即用** | ✅ 双击即用 | ❌ 需要配置 |
| **本地GGUF** | ✅ 直接驱动 | ❌ 需要转换 |
| **智能记忆** | ✅ 持久化上下文 | ❌ 无记忆 |
| **中文优化** | ✅ 原生支持 | ⚠️ 部分支持 |

---

## ✨ 功能特性

### 🤖 智能对话
- **流式响应** - 实时显示AI回复
- **多轮对话** - 支持上下文关联
- **智能记忆** - 自动压缩和持久化重要信息

### 📁 本地模型
- **GGUF直驱** - 直接加载和运行GGUF模型
- **模型扫描** - 自动扫描指定目录的模型文件
- **一键切换** - 轻松切换不同模型

### 🔧 高级功能
- **智能搜索** - 实时网络搜索，获取最新信息
- **意图识别** - 自动理解用户需求
- **自我学习** - 持续优化响应质量

### 🎨 现代界面
- **DSH风格** - 专业美观的用户界面
- **暗色主题** - 舒适的视觉体验
- **响应式** - 自适应窗口大小

---

## 📸 截图展示

<div align="center">

**主界面**
![主界面](docs/screenshots/main.png)

**模型设置**
![模型设置](docs/screenshots/settings.png)

</div>

---

## 🚀 快速开始

### 下载安装

1. **下载** - 从 [Releases](https://github.com/reasonix000/agent-z/releases) 下载最新版本
2. **解压** - 双击 `Z.exe`，选择安装目录
3. **运行** - 自动启动 Agent-Z

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/reasonix000/agent-z.git
cd agent-z

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

### 使用模型

1. 将 GGUF 模型文件放入 `resources/models/` 目录
2. 在应用中选择模型
3. 开始对话！

---

## 📋 系统要求

- **操作系统** - Windows 10/11 (64位)
- **内存** - 4GB RAM (推荐8GB+)
- **存储** - 1GB 可用空间
- **GPU** - 可选 (支持CUDA加速)

---

## 🛠️ 技术架构

| 层级 | 技术 |
|------|------|
| **桌面框架** | Electron 28 |
| **前端** | React 18 + TypeScript |
| **后端** | Node.js |
| **LLM引擎** | llama.cpp |
| **构建工具** | Vite + electron-builder |

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- [llama.cpp](https://github.com/ggerganov/llama.cpp) - LLM推理引擎
- [Electron](https://www.electronjs.org/) - 桌面应用框架
- [React](https://reactjs.org/) - UI库

---

<div align="center">

**如果觉得有用，请给个 ⭐ Star 支持一下！**

</div>
