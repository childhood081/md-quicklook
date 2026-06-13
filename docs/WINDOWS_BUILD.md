# Windows Build Guide

md-quicklook Windows 安装包构建完整指南 — 从环境准备到安装测试。

## 环境要求

| 组件 | 版本要求 | 说明 |
|------|----------|------|
| Windows OS | Windows 10+ (x64) | 或 Windows 11 |
| Node.js | 18+ | 推荐 20 LTS |
| npm | 9+ | 随 Node.js 安装 |
| Rust | 1.77.2+ | 通过 rustup 安装 |
| Microsoft Visual C++ Build Tools | 2019+ | 或 Visual Studio 2022 Build Tools |
| WebView2 Runtime | 系统自带 | Windows 10 1809+ 己内置，Windows 7/8 需手动安装 |

### 详细安装步骤

#### 1. Node.js

从 https://nodejs.org/ 下载 Windows 安装包（推荐 20.x LTS），安装时勾选"Automatically install the necessary tools"。

验证：
```powershell
node --version   # 应 >= 18
npm --version    # 应 >= 9
```

#### 2. Rust

访问 https://rustup.rs/ 下载 `rustup-init.exe` 并运行。

验证：
```powershell
rustc --version  # 应 >= 1.77.2
cargo --version
```

#### 3. Microsoft C++ Build Tools

方案 A（推荐）：安装 Visual Studio Build Tools
- 下载：https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
- 安装时勾选"Desktop development with C++"
- 确保 MSVC v143 和 Windows 11 SDK 被选中

方案 B：安装完整 Visual Studio 2022 Community
- 下载：https://visualstudio.microsoft.com/downloads/
- 安装时勾选"Desktop development with C++"工作负载

验证：
```powershell
# 确认 cl.exe 在 PATH 中（从 Developer Command Prompt 运行）
where cl
```

#### 4. WebView2 Runtime

Windows 10 1809+ / Windows 11 己内置，无需额外安装。

如需手动安装或升级：
- 下载 Evergreen Bootstrapper：https://developer.microsoft.com/microsoft-edge/webview2/
- 或下载 Fixed Version：https://developer.microsoft.com/microsoft-edge/webview2/

## 安装依赖

```powershell
# 克隆仓库（如未克隆）
git clone <repo-url>
cd md-quicklook

# 安装前端依赖
npm install
```

## 构建命令

### 开发模式

```powershell
# 启动 Tauri 开发服务器（带热重载）
npx tauri dev

# 开发模式下打开指定文件
npx tauri dev -- path\to\file.md
```

### 生产构建

```powershell
# 前端类型检查 + 构建
npm run build

# Rust 编译检查（快速验证，不生成产物）
cargo check --manifest-path src-tauri\Cargo.toml

# 完整 Tauri 构建（生成 .exe 安装包）
npx tauri build
```

## 产物位置

| 产物 | 路径 |
|------|------|
| Windows 安装包 | `src-tauri\target\release\bundle\nsis\md-quicklook_1.9.0_x64-setup.exe` |
| 未打包的 .exe | `src-tauri\target\release\md-quicklook.exe` |
| NSIS 安装脚本 | `src-tauri\target\release\bundle\nsis\` (中间产物) |

> 当前配置禁用 WiX (.msi)，仅生成 NSIS (.exe) 安装程序。

## 安装测试

### 全新安装

1. 双击 `md-quicklook_1.9.0_x64-setup.exe`
2. 选择安装路径（默认 `%LOCALAPPDATA%\md-quicklook`）
3. 安装过程中：
   - 确认桌面快捷方式创建选项（如已配置）
   - 确认文件关联注册提示
4. 安装完成后验证：
   - 桌面快捷方式存在且图标正确
   - 开始菜单 → `md-quicklook` 文件夹含应用快捷方式和卸载入口
5. 从桌面快捷方式启动应用，确认欢迎页正常显示

### 升级安装

1. 关闭正在运行的 md-quicklook
2. 运行新版安装程序
3. 安装程序自动覆盖旧版本
4. 验证：
   - 用户配置（语言偏好、最近文件）保留
   - 版本号更新

## 文件关联测试

### .md 文件

1. 在文件资源管理器找到任意 `.md` 文件
2. 右键 → **Open with** → **Choose another app** → 选择 **md-quicklook** → 勾选 **Always**
3. 双击 `.md` 文件 → 确认在 md-quicklook 中打开
4. 验证文件内容正确渲染

### .markdown 文件

1. 对 `.markdown` 文件重复上述步骤
2. 确认同样能正确打开

### 应用已运行时双击文件

1. 先打开 md-quicklook（显示欢迎页或已打开文件）
2. 在文件资源管理器中双击另一个 `.md` 文件
3. 确认应用通过 CLI args 打开目标文件

## Windows 菜单测试

### 菜单语言

1. 打开 md-quicklook
2. 检查原生菜单栏文字：
   - 默认中文：文件/编辑/视图/语言/帮助
   - 通过 语言( Language) → English 切换
   - 切换后菜单立即变为英文：File/Edit/View/Language/Help

### 菜单功能

| 菜单项 | 操作 | 预期结果 |
|--------|------|----------|
| 文件 → 打开 | 选择 .md 文件 | 文件在阅读模式打开 |
| 文件 → 保存 | 点击保存 | 显示"已保存"提示 |
| 文件 → 另存为 | 选择新路径 | 文件另存成功 |
| 文件 → 导出 Word | 选择保存路径 | 生成 .docx 文件 |
| 文件 → 导出 Excel | 选择保存路径 | 生成 .xlsx 文件 |
| 视图 → 阅读/编辑/源码 | 切换模式 | 编辑器模式切换 |
| 视图 → 显示/隐藏目录 | 切换 | 目录面板显示/隐藏 |
| 视图 → 放大/缩小/实际大小 | 操作 | 窗口缩放变化 |
| 语言 → 中文/English | 切换 | 菜单和界面语言切换 |
| 帮助 → 使用说明 | 点击 | 显示使用提示 |
| 帮助 → 关于 | 点击 | 显示关于对话框 |

### Windows 特定菜单项

Windows 原生菜单中不应出现 macOS 专属项（Services、Hide、Hide Others、Show All）。
这些在 Rust 代码中已由 `#[cfg(target_os = "macos")]` 条件编译排除。

## Word / Excel 导出测试

### Word 导出

1. 打开包含中英文内容的 Markdown 文件
2. 文件 → 导出 Word
3. 选择保存路径，确认默认文件名为 `<原文件名>.docx`
4. 打开生成的 .docx：
   - Word / WPS / LibreOffice 可正常打开
   - 中文内容无乱码
   - 标题使用适当字体
   - 代码块保留等宽字体

### Excel 导出

1. 打开包含表格的 Markdown 文件
2. 文件 → 导出 Excel
3. 选择保存路径
4. 打开生成的 .xlsx：
   - Excel / WPS / LibreOffice 可正常打开
   - 多表格生成多 sheet
   - Sheet 名从标题提取
   - 数字列正确识别为数字格式
   - 表头行冻结

### 无表格文档导出 Excel

1. 打开无表格的 Markdown 文件
2. 文件 → 导出 Excel
3. 预期：显示"当前 Markdown 文档中没有可导出的表格"提示，不弹出保存对话框

### 取消导出

1. 触发导出
2. 在保存对话框中点击取消
3. 预期：不显示错误提示，编辑器状态不变

## 卸载测试

### 通过 Windows 设置卸载

1. 打开 **设置 → Apps → Installed apps**
2. 搜索 "md-quicklook"
3. 点击 **Uninstall**
4. 确认卸载完成

### 通过开始菜单卸载

1. 开始菜单 → `md-quicklook` 文件夹 → **Uninstall**
2. 确认卸载完成

### 卸载后验证

1. 应用安装目录（`%LOCALAPPDATA%\md-quicklook`）已删除
2. 桌面快捷方式已移除
3. 开始菜单文件夹已移除
4. 注意：用户数据（`%APPDATA%\com.mdquicklook.desktop\`）可能残留，需手动清理
5. 注意：.md/.markdown 文件关联不会自动恢复

## 已知限制

### 签名与安全
- **未签名**：当前安装包无代码签名证书
- **SmartScreen 警告**：未签名的 .exe 下载/运行时 Windows Defender SmartScreen 会显示 "Windows protected your PC" 警告
- 用户需点击 **More info → Run anyway** 继续
- 获得 EV Code Signing Certificate 后 SmartScreen 信誉会逐步建立

### 安装模式
- 仅支持 `currentUser`（当前用户）安装
- 无需管理员权限，安装路径在用户目录下
- 如需所有用户安装，改为 `perMachine` 但需管理员权限

### 多实例
- 当前不限制多实例，用户可同时打开多个 md-quicklook 窗口
- 每个窗口独立运行，各自管理打开的文件

### 格式与平台
- 仅生成 NSIS (.exe) 安装程序，无 WiX (.msi)
- 当前 Windows 安装包**尚未在真实 Windows 机器上构建和验证**
- 所有 Windows 配置仅基于文档和代码审查

### 卸载残余
- 用户配置数据不会自动清理（与 NSIS `currentUser` 模式的默认行为一致）
- 文件关联不会恢复为安装前的程序

### 构建
- 需在 Windows 实机或 CI 环境（GitHub Actions windows-latest）构建
- macOS 上可交叉编译但链接步骤复杂，不推荐
