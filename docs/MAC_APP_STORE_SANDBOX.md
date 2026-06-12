# Mac App Store Sandbox & Entitlements

md-quicklook Mac App Store 分发的沙盒与 entitlements 技术预检。

> 当前状态：未配置沙盒，不可直接提交 App Store。本文档记录所需条件、权限模型和实施步骤。

## 1. App Sandbox 要求

### 当前状态

- **未启用 App Sandbox** — 当前普通 DMG 构建不包含沙盒配置
- Tauri 2 默认不生成 entitlements.plist
- Mac App Store **强制要求** App Sandbox 启用

### 验证要点

App Sandbox 启用后必须验证以下功能：
- [ ] 打开用户选择的 .md 文件（NSOpenPanel → Powerbox 授权）
- [ ] 阅读模式下渲染文件内容（需持续读取权限）
- [ ] 编辑/源码模式下原地保存（同名文件写入）
- [ ] 自动保存（800ms 防抖后的原子写入）
- [ ] .bak 备份文件创建（同目录下写入新文件）
- [ ] Word 导出到用户选择路径（NSSavePanel → Powerbox 授权）
- [ ] Excel 导出到用户选择路径
- [ ] 语言偏好持久化（settings.json 写入）
- [ ] 最近文件列表（localStorage，不受沙盒影响）

## 2. 需要的 Entitlements

### 核心 Entitlements

| Entitlement | 必须 | 说明 |
|-------------|------|------|
| `com.apple.security.app-sandbox` | **是** | 启用沙盒 |
| `com.apple.security.files.user-selected.read-write` | **是** | 允许读写用户通过对话框选择的文件 |
| `com.apple.security.files.downloads.read-write` | 建议 | 允许访问下载文件夹（用户常从这里打开 .md 文件） |

### 可选 Entitlements

| Entitlement | 需要 | 说明 |
|-------------|------|------|
| `com.apple.security.network.client` | 否 | 应用无网络访问 |
| `com.apple.security.network.server` | 否 | 应用无监听端口 |
| `com.apple.security.files.pictures.read-write` | 否 | 不访问图片文件夹 |
| `com.apple.security.files.movies.read-write` | 否 | 不访问影片文件夹 |
| `com.apple.security.files.music.read-write` | 否 | 不访问音乐文件夹 |
| `com.apple.security.device.camera` | 否 | 不使用摄像头 |
| `com.apple.security.device.microphone` | 否 | 不使用麦克风 |
| `com.apple.security.print` | 否 | 不直接打印 |

### draft entitlements.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>

    <!-- 用户通过对话框选择/保存的文件 -->
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>

    <!-- 允许访问下载文件夹（用户常用场景） -->
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
</dict>
</plist>
```

> 此 entitlements 文件尚未创建到 `src-tauri/entitlements.plist`。
> 原因：在创建前需要确认不会破坏当前普通 DMG 构建的签名行为。
> 如果 Tauri 2 在 entitlements 文件存在时自动启用沙盒签名，可能影响当前未签名 DMG 的行为。

## 3. 用户选择文件读写的权限模型

### 当前实现（非沙盒）

```
用户点击 File → Open
  → NSOpenPanel (tauri-plugin-dialog)
    → 用户选择文件 → 返回路径字符串
      → Rust std::fs::read_to_string(path)
        → 返回内容给前端渲染
```

路径存储在 Pinia store 中（`currentFilePath`）。后续自动保存和手动保存直接使用该路径写入，**无需再次请求权限**。

### 沙盒下的变化

沙盒启用后，通过 NSOpenPanel 返回的路径包含 Powerbox 临时授权：

```
用户点击 File → Open
  → NSOpenPanel (Powerbox 介入，授予该文件的临时读写权限)
    → 用户选择文件 → 返回 security-scoped URL
      → Rust 获得该路径的临时读写权限
        → 本次会话内可以读写该文件及其同目录下的文件（如 .bak）
```

关键差异：
- **同目录操作**：沙盒允许对已授权文件所在目录进行有限操作（如创建 .bak 文件），但具体行为取决于 macOS 版本。
- **跨会话持久化**：如果用户希望在下次启动时继续编辑同一文件，需要 security-scoped bookmark。但目前 md-quicklook 的"最近文件"仅存储路径字符串，**不包含 security-scoped bookmark**。

### Security-Scoped Bookmark 适配需求

如果希望沙盒下完整支持以下场景，需要适配 security-scoped bookmarks：

| 场景 | 当前实现 | 沙盒下是否需要 Bookmark |
|------|----------|------------------------|
| 本次会话内打开/编辑/保存 | 路径字符串 | 否，Powerbox 临时授权即可 |
| 关闭文件后重新打开（同一次启动） | 路径字符串 | 视 macOS 版本 |
| 重启应用后从"最近文件"打开 | localStorage 中的路径字符串 | **可能**需要，否则需要用户重新通过对话框选择 |
| 导出 Word/Excel 到用户选择路径 | NSSavePanel 每次触发 | 否，每次导出都是新的 Powerbox 授权 |

> 实施建议：如果用户对"最近文件"功能依赖度不高，可以先启用沙盒验证基础文件操作是否正常，再决定是否接入 security-scoped bookmarks。

## 4. 导出路径选择的权限模型

### 当前实现（非沙盒）

```
用户点击 File → Export Word/Excel
  → NSSavePanel (tauri-plugin-dialog)
    → 用户选择保存位置 → 返回路径字符串
      → 前端生成文档内容（docx/xlsx）
        → invoke('export_docx/export_xlsx', { outputPath, bytes })
          → Rust write_bytes_atomically(outputPath)
            → temp-file + rename
```

### 沙盒下的行为

沙盒下 NSSavePanel 会通过 Powerbox 授予用户选择的目标路径的写入权限。`write_bytes_atomically` 中的 temp-file + rename 操作在**同一目录内**，理论上在沙盒授权范围内。

需要验证的点：
- [ ] temp-file 创建在用户选择的目录中，沙盒是否允许
- [ ] `fs::rename` 跨 inode 操作在沙盒目录中是否正常工作
- [ ] 如果用户覆盖已有文件，沙盒是否要求额外的写入权限确认

## 5. Tauri App Store 分发的特殊要求

### Tauri 2 App Store 分发与普通 DMG 的区别

| 方面 | 普通 DMG | App Store |
|------|----------|-----------|
| 构建命令 | `npx tauri build` | `npx tauri build --bundles app` |
| 签名证书 | Developer ID Application | Apple Distribution |
| 沙盒 | 可选 | 必须 |
| 分发方式 | 手动下载 | App Store |
| 公证 | 需要 (notarytool) | App Store 自动处理 |
| 安装位置 | `/Applications` | `/Applications`（由 App Store 管理） |
| 更新方式 | 手动下载 | App Store 自动更新 |
| Bundle ID | `com.mdquicklook.desktop` | 建议独立 ID（如 `com.mdquicklook.app`） |

### Bundle ID 策略

App Store 分发包和直接分发 DMG 包建议使用不同的 Bundle ID：

```
直接分发: com.mdquicklook.desktop
App Store: com.mdquicklook.app
```

原因：
1. macOS 将不同 Bundle ID 视为不同应用，可同时安装两个版本
2. 避免沙盒签名配置影响 DMG 构建流程
3. App Store Connect 中需创建对应 Bundle ID 的 App 记录

在 `tauri.conf.json` 中可通过环境变量切换：
```bash
# App Store 构建
TAURI_BUNDLE_IDENTIFIER=com.mdquicklook.app npx tauri build --bundles app

# DMG 构建（保持默认）
npx tauri build
```

### Tauri 官方 App Store 分发指南

参考：https://v2.tauri.app/distribute/mac-app-store/

关键步骤：
1. 在 Xcode 中配置签名证书和 provisioning profile
2. 配置 entitlements 启用沙盒
3. 使用 `npx tauri build --bundles app` 获取 `.app`
4. 在 Xcode 中 Archive → Validate → Distribute to App Store Connect
5. 通过 Transporter 或 Xcode 上传

## 6. 当前不可提交 App Store 的原因

| 阻塞项 | 说明 |
|--------|------|
| Apple Developer Program | 未注册（$99/年，前置必须） |
| 签名证书 | 无 Apple Distribution 证书 |
| App Sandbox | 未配置，未验证 |
| entitlements.plist | 未创建 |
| App Store Connect 记录 | 未创建 |
| 隐私政策 URL | 未上线 |
| Xcode Archive 验证 | 未执行 |
| Security-Scoped Bookmark | 未评估是否需要实施 |

## 7. 后续实施步骤

### 阶段 1：前置准备（完成后方可进行阶段 2）

1. 注册 Apple Developer Program
2. 在 App Store Connect 创建 App 记录（Bundle ID: `com.mdquicklook.app`）
3. 在 Xcode 中配置 Apple Distribution 签名证书
4. 准备并上线隐私政策页面

### 阶段 2：沙盒适配（需要阶段 1 完成）

5. 创建 `src-tauri/entitlements.plist`（示例见第 2 节）
6. 在 `tauri.conf.json` 中配置 App Store 专用的 Bundle ID 和 entitlements 路径
7. 构建沙盒版本并进行完整功能测试（按第 1 节的验证清单）
8. 根据测试结果决定是否需要 security-scoped bookmarks

### 阶段 3：提交（需要阶段 2 完成）

9. 准备 App Store 截图和元数据（参考 `docs/APP_STORE_METADATA_DRAFT.md`）
10. 通过 Xcode Archive → Validate → Distribute to App Store Connect
11. 在 App Store Connect 中填写所有元数据
12. 提交审核

### 阶段 4：审核后

13. 处理 Apple 审核反馈
14. 通过后发布
15. 监控用户反馈和崩溃报告（如有）

## 8. 关于 entitlements.plist 的创建

当前**不建议立即创建** `src-tauri/entitlements.plist`。

原因：
- 当前构建为普通 DMG，不签名、不启用沙盒
- 在 `tauri.conf.json` 中配置 `macOS.entitlements` 字段后，Tauri 可能自动在签名阶段嵌入 entitlements
- 虽然当前未签名，但引入 entitlements 文件可能是构建流程中的不确定因素
- 在没有 Apple Developer Program 和签名证书的情况下，沙盒适配的价值有限

**创建时机**：完成阶段 1（Apple Developer Program + 签名证书）后，再进行阶段 2（沙盒适配），届时与沙盒测试一起创建和配置 entitlements。
