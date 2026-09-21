#!/usr/bin/env bash
set -e

# 智能体Z 安装脚本 (Linux/macOS)

echo "========================================"
echo "  智能体Z (Agent-Z) 安装脚本"
echo "========================================"
echo ""

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "freebsd"* ]]; then
        echo "freebsd"
    else
        echo "unknown"
    fi
}

# 检测架构
detect_arch() {
    local arch=$(uname -m)
    case $arch in
        x86_64|amd64)
            echo "x64"
        ;;
        aarch64|arm64)
            echo "arm64"
        ;;
        armv7l|armhf)
            echo "armv7"
        ;;
        *)
            echo "unknown"
        ;;
    esac
}

# 检查依赖
check_dependencies() {
    local deps=("curl" "unzip")
    for dep in "${deps[@]}"; do
        if ! command -v $dep &> /dev/null; then
            echo "错误: 缺少依赖 $dep"
            echo "请先安装 $dep"
            exit 1
        fi
    done
}

# 安装Bun
install_bun() {
    if command -v bun &> /dev/null; then
        echo "✓ Bun 已安装"
        return
    fi
    
    echo "正在安装 Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    echo "✓ Bun 安装完成"
}

# 下载并安装智能体Z
install_agent_z() {
    local os=$(detect_os)
    local arch=$(detect_arch)
    local version="0.1.0"
    local url="https://github.com/agent-z/agent-z/releases/download/v${version}/agent-z-${os}-${arch}.zip"
    
    echo "正在下载智能体Z v${version}..."
    echo "平台: ${os}-${arch}"
    
    # 创建临时目录
    local tmp_dir=$(mktemp -d)
    cd "$tmp_dir"
    
    # 下载
    curl -L -o agent-z.zip "$url"
    
    # 解压
    unzip -q agent-z.zip
    
    # 安装
    sudo mkdir -p /usr/local/bin
    sudo cp agent-z /usr/local/bin/
    sudo chmod +x /usr/local/bin/agent-z
    
    # 清理
    cd /
    rm -rf "$tmp_dir"
    
    echo "✓ 智能体Z 安装完成"
}

# 配置
setup_config() {
    local config_dir="$HOME/.config/agent-z"
    local config_file="$config_dir/config.json"
    
    if [ ! -d "$config_dir" ]; then
        mkdir -p "$config_dir"
    fi
    
    if [ ! -f "$config_file" ]; then
        cat > "$config_file" << 'EOF'
{
  "model": "ollama/llama3.2",
  "provider": {
    "ollama": {
      "name": "Ollama",
      "baseURL": "http://localhost:11434",
      "models": {
        "llama3.2": { "name": "Llama 3.2" },
        "qwen2.5": { "name": "Qwen 2.5" }
      }
    }
  }
}
EOF
        echo "✓ 配置文件已创建: $config_file"
    fi
}

# 主函数
main() {
    echo "检测系统信息..."
    echo "  操作系统: $(detect_os)"
    echo "  架构: $(detect_arch)"
    echo ""
    
    check_dependencies
    install_bun
    install_agent_z
    setup_config
    
    echo ""
    echo "========================================"
    echo "  安装完成!"
    echo "========================================"
    echo ""
    echo "使用方法:"
    echo "  agent-z"
    echo ""
    echo "配置文件位置:"
    echo "  ~/.config/agent-z/config.json"
    echo ""
    echo "更多信息请访问:"
    echo "  https://github.com/agent-z/agent-z"
}

main "$@"
