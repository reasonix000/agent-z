#Requires -Version 5.1
# 智能体Z 安装脚本 (Windows PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  智能体Z (Agent-Z) 安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 检查依赖
function Test-Dependencies {
    $deps = @("curl", "unzip")
    foreach ($dep in $deps) {
        if (-not (Get-Command $dep -ErrorAction SilentlyContinue)) {
            Write-Host "错误: 缺少依赖 $dep" -ForegroundColor Red
            Write-Host "请先安装 $dep"
            exit 1
        }
    }
}

# 安装Bun
function Install-Bun {
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        Write-Host "✓ Bun 已安装" -ForegroundColor Green
        return
    }
    
    Write-Host "正在安装 Bun..."
    irm bun.sh/install.ps1 | iex
    $env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"
    Write-Host "✓ Bun 安装完成" -ForegroundColor Green
}

# 下载并安装智能体Z
function Install-AgentZ {
    $os = "windows"
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $version = "0.1.0"
    $url = "https://github.com/agent-z/agent-z/releases/download/v${version}/agent-z-${os}-${arch}.zip"
    
    Write-Host "正在下载智能体Z v${version}..."
    Write-Host "平台: ${os}-${arch}"
    
    # 创建临时目录
    $tmpDir = Join-Path $env:TEMP "agent-z-install"
    if (Test-Path $tmpDir) { Remove-Item -Recurse -Force $tmpDir }
    New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
    
    # 下载
    $zipFile = Join-Path $tmpDir "agent-z.zip"
    Invoke-WebRequest -Uri $url -OutFile $zipFile
    
    # 解压
    Expand-Archive -Path $zipFile -DestinationPath $tmpDir -Force
    
    # 安装
    $installDir = "$env:LOCALAPPDATA\agent-z"
    if (-not (Test-Path $installDir)) {
        New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    }
    
    Copy-Item -Path "$tmpDir\agent-z.exe" -Destination $installDir -Force
    
    # 添加到PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$installDir*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "User")
        $env:PATH = "$installDir;$env:PATH"
    }
    
    # 清理
    Remove-Item -Recurse -Force $tmpDir
    
    Write-Host "✓ 智能体Z 安装完成" -ForegroundColor Green
}

# 配置
function Setup-Config {
    $configDir = "$env:APPDATA\agent-z"
    $configFile = "$configDir\config.json"
    
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    }
    
    if (-not (Test-Path $configFile)) {
        $config = @"
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
"@
        Set-Content -Path $configFile -Value $config
        Write-Host "✓ 配置文件已创建: $configFile" -ForegroundColor Green
    }
}

# 主函数
function Main {
    Write-Host "检测系统信息..." -ForegroundColor Yellow
    Write-Host "  操作系统: Windows"
    Write-Host "  架构: $(if ([Environment]::Is64BitOperatingSystem) { 'x64' } else { 'x86' })"
    Write-Host ""
    
    Test-Dependencies
    Install-Bun
    Install-AgentZ
    Setup-Config
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  安装完成!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "使用方法:" -ForegroundColor Yellow
    Write-Host "  agent-z"
    Write-Host ""
    Write-Host "配置文件位置:" -ForegroundColor Yellow
    Write-Host "  $env:APPDATA\agent-z\config.json"
    Write-Host ""
    Write-Host "更多信息请访问:" -ForegroundColor Yellow
    Write-Host "  https://github.com/agent-z/agent-z"
}

Main
