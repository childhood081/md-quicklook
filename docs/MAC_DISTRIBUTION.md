# macOS Distribution

macOS 安装包构建与分发指南 — 涵盖 .app bundle 和 .dmg 安装包。

## 构建命令

### 开发构建

```bash
# Debug 模式（不打包，仅编译二进制 + 启动 dev server）
npx tauri dev
```

### 生产构建

```bash
# 前端构建
npm run build

# 完整 Tauri 构建（生成 .app + .dmg）
npx tauri build

# 当前 macOS beta 推荐：Tauri 生成 .app，hdiutil 生成可重复 .dmg
scripts/build-macos-dmg.sh
```

构建产物会自动生成在 `src-tauri/target/release/bundle/` 目录下。

> 当前 macOS 16 beta 环境中，Tauri 自动 `.dmg` 阶段使用的 `create-dmg` 可能失败。beta 包请优先使用 `scripts/build-macos-dmg.sh`，详见 `docs/MAC_DMG_SCRIPT.md`。

## 产物位置

| 产物 | 路径 |
|------|------|
| .app (Intel) | `src-tauri/target/release/bundle/macos/md-quicklook.app` |
| .app (Apple Silicon) | `src-tauri/target/release/bundle/macos/md-quicklook.app` |
| .dmg (Intel) | `src-tauri/target/release/bundle/dmg/md-quicklook_1.9.0_x64.dmg` |
| .dmg (Apple Silicon) | `src-tauri/target/release/bundle/dmg/md-quicklook_1.9.0_aarch64.dmg` |
| .dmg (Universal) | `src-tauri/target/release/bundle/dmg/md-quicklook_1.9.0_universal.dmg` |

## 架构策略

### Apple Silicon / Intel / Universal Binary

Tauri 2 支持三种 macOS 构建目标：

- **x86_64-apple-darwin** — Intel Mac
- **aarch64-apple-darwin** — Apple Silicon (M1/M2/M3)
- **universal-apple-darwin** — 同时包含两种架构

**建议**：
- 开发阶段：仅构建当前机器架构（Tauri 默认行为）
- 发布阶段：构建 Universal Binary 覆盖所有 Mac

构建 Universal Binary：
```bash
npx tauri build --target universal-apple-darwin
```

需要在 `src-tauri/` 下安装对应的 Rust target：
```bash
rustup target add x86_64-apple-darwin aarch64-apple-darwin
```

### 当前构建状态

- 当前开发机器为 Apple Silicon (aarch64)
- 默认 `npx tauri build` 将生成 aarch64 .dmg
- Intel 和 Universal 需要手动指定 target

## 测试 .app

1. 构建后进入 bundle 目录：
   ```bash
   open src-tauri/target/release/bundle/macos/md-quicklook.app
   ```
2. 验证应用启动正常，显示欢迎页
3. 通过 File → Open 打开一个 .md 文件
4. 验证阅读/编辑/源码模式切换
5. 验证导出 Word/Excel

## 测试 .dmg

1. 双击打开 `.dmg` 文件
2. 将 `md-quicklook.app` 拖入 `/Applications`
3. 从 `/Applications` 启动应用
4. 验证功能完整性

## 测试文件关联

1. 在 Finder 中找到任意 `.md` 文件
2. 右键 → **Get Info** → **Open with** → 选择 `md-quicklook.app` → **Change All**
3. 双击 `.md` 文件，确认在 md-quicklook 中打开
4. 对 `.markdown` 文件重复步骤 2-3

## 配置说明

### tauri.conf.json 字段

```json
{
  "bundle": {
    "macOS": {
      "minimumSystemVersion": "11.0"
    },
    "fileAssociations": [
      {
        "ext": ["md", "markdown"],
        "name": "Markdown",
        "description": "Markdown document",
        "role": "Editor"
      }
    ]
  }
}
```

### Info.plist

Tauri 2 自动从 `tauri.conf.json` 生成 `Info.plist`，无需手动创建。
关键字段由 bundle 配置派生：

| Info.plist 字段 | tauri.conf.json 来源 |
|-----------------|---------------------|
| CFBundleIdentifier | `identifier` |
| CFBundleVersion | `version` |
| CFBundleShortVersionString | `version` |
| CFBundleName | `productName` |
| CFBundleDocumentTypes | `fileAssociations` |
| LSMinimumSystemVersion | `macOS.minimumSystemVersion` |

## Gatekeeper 限制（未签名）

未签名的 macOS 应用在首次打开时会受到 Gatekeeper 阻止：

```
"md-quicklook.app" can't be opened because Apple cannot check it for malicious software.
```

**绕过方法**（仅用于测试）：
1. 右键点击 `.app` → **Open**
2. 在弹出对话框中选择 **Open**
3. 此操作只需执行一次

或通过命令行移除 quarantine 标记：
```bash
xattr -d com.apple.quarantine /path/to/md-quicklook.app
```

## Developer ID 签名

### 前提条件

- Apple Developer Program 会员（$99/年）
- 在 Xcode 中配置 Developer ID Application 证书
- 在 Keychain Access 中确认证书可用

### Tauri 2 签名配置

在 `tauri.conf.json` 中添加：

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAMID)"
    }
  }
}
```

签名后构建：
```bash
npx tauri build --bundles dmg
```

### 验证签名

```bash
codesign -dvvv src-tauri/target/release/bundle/macos/md-quicklook.app
spctl -a -v src-tauri/target/release/bundle/macos/md-quicklook.app
```

## Notarization

### 前提条件

1. Apple Developer Program 会员
2. Developer ID Application 签名证书
3. App Store Connect API Key（用于 `notarytool`）或 Apple ID（用于 `altool`）

### Tauri 2 Notarization

Tauri 2 目前不内置 notarization。需使用 Apple 的 `notarytool` 手动公证：

```bash
# 1. 先签名
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAMID)" \
  src-tauri/target/release/bundle/macos/md-quicklook.app

# 2. 创建 .dmg 后提交公证
xcrun notarytool submit md-quicklook_1.9.0_aarch64.dmg \
  --keychain-profile "AC_PASSWORD" \
  --wait

# 3. 装订公证票据（staple）
xcrun stapler staple md-quicklook_1.9.0_aarch64.dmg
```

### 当前状态

| 项目 | 状态 |
|------|------|
| Apple Developer Program | **未注册** |
| Developer ID 签名证书 | **无** |
| Notarization | **未执行** |
| 可进行未签名测试分发 | **是（需手动绕过 Gatekeeper）** |
| 当前发布标记 | **v1.9.0-beta** |
| 自动 create-dmg | **当前 macOS 16 beta 环境存在兼容风险** |
| hdiutil 脚本化 DMG | **已支持：scripts/build-macos-dmg.sh** |

## 已知限制

- 未签名的 .dmg 在分发时用户需要绕过 Gatekeeper
- 未公证的 .dmg 在首次启动时有额外警告
- 当前 beta DMG 使用 `hdiutil` 脚本生成，不代表已完成正式签名/公证流程
- macOS 10.15 (Catalina) 已不再支持，最低要求 macOS 11.0 (Big Sur)
