# Mac App Store 上架准备

AI 文档快看上架 Mac App Store 的技术条件与文档准备。

## Apple Developer Program 前置条件

上架 Mac App Store 必须满足：

1. **Apple Developer Program 会员**
   - 年费 $99 USD
   - 注册地址：https://developer.apple.com/programs/
   - 需要有效的 Apple ID

2. **Xcode 环境**
   - 最新版 Xcode（通过 Mac App Store 安装）
   - 在 Xcode → Settings → Accounts 中登录 Developer Apple ID
   - 配置 Apple Development / Apple Distribution 证书

3. **App Store Connect 记录**
   - 在 https://appstoreconnect.apple.com 创建 App 记录
   - 需要 Bundle ID 与 App 记录匹配

## 当前状态（2026-07-30）

| 检查项 | 当前结果 | 是否阻断上传 |
|--------|----------|--------------|
| Xcode | `/Applications/Xcode.app` 已安装，版本 26.5；`xcode-select` 当前仍指向 Command Line Tools，但构建脚本会在进程内使用完整 Xcode | 否 |
| `xcodebuild` | 通过 `/Applications/Xcode.app/Contents/Developer` 可用 | 否 |
| `altool` | Xcode 内存在 `altool` | 否 |
| `productbuild` | 可用 | 否 |
| Transporter | `/Applications/Transporter.app` 已用于上传 build 23 | 否 |
| Apple Distribution 证书 | 本机 Keychain 存在 | 否 |
| 3rd Party Mac Developer Installer 证书 | 本机 Keychain 存在 | 否 |
| Bundle ID | Apple Developer 已注册 `com.mdquicklook.desktop` | 否 |
| App Store Connect App 记录 | 已创建，App ID `6779720577`，名称应保持为 `AI 文档快看` | 否 |
| Mac App Store provisioning profile | 已使用匹配 `88Y78WLD7A.com.mdquicklook.desktop` 的 profile 构建 | 否 |
| App Store 构建 | `1.0.0 (23)` 已上传并通过 App Review | 否 |
| 发布方式 | 手动发布；当前状态为“等待开发者发布” | 需要开发者最终确认 |

当前结论：App Store Connect App 记录、签名、沙盒包、元数据和审核均已完成。版本尚未公开，最终发布动作仍保留为人工确认。

参考：Tauri 2 官方 App Store 文档要求 App Store 分发前完成 Apple Developer Program、代码签名、App Store Connect App 记录、App Sandbox entitlements、Mac App Store Connect provisioning profile，并将签名 `.pkg` 上传到 App Store Connect。

## Bundle ID 建议

### 当前配置

```
identifier: "com.mdquicklook.desktop"
```

### App Store 建议

App Store 可以继续使用当前 Bundle ID，也可以独立于直接分发版本：

| 分发渠道 | Bundle ID 建议 |
|----------|---------------|
| 直接分发 (.dmg) | `com.mdquicklook.desktop` |
| Mac App Store（保守方案） | `com.mdquicklook.desktop` |
| Mac App Store（渠道隔离方案） | `com.mdquicklook.app` |

建议：

- 如果 App Store Connect 已经创建了 `com.mdquicklook.desktop`，继续使用它，风险最低。
- 如果尚未创建 App Store Connect 记录，且希望区分直接分发和商店分发，可考虑 `com.mdquicklook.app`。
- 不要在未确认 App Store Connect 记录前随意改 Bundle ID。
- 当前构建脚本通过 `APPSTORE_BUNDLE_IDENTIFIER` 生成临时 App Store 配置，不改主 `tauri.conf.json`。

## App Sandbox 检查

### 当前状态

- **未启用 App Sandbox**
- Tauri 2 默认不在 entitlements 中启用 sandbox
- 上架 Mac App Store **必须**启用 App Sandbox

### 需要新增的 Entitlements 文件

已新增 `src-tauri/entitlements/app-store.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>

    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
```

当前不申请网络、Downloads、Documents 等宽权限。文件打开、保存、Word/Excel 导出都应通过用户主动选择路径获得授权。

### 沙盒文件访问分析

| 功能 | 沙盒兼容 | 说明 |
|------|----------|------|
| 打开用户选择的 .md 文件 | **是** | 通过 `dialog:allow-open` + Powerbox |
| 保存 Markdown 文件 | **是** | 通过 `dialog:allow-save` + Powerbox |
| 导出 Word / Excel | **是** | 通过 `dialog:allow-save` + Powerbox |
| 自动保存（原位写入） | **需要验证** | 沙盒下，通过 Powerbox 打开的文件的 security-scoped bookmark 可以继续写入 |
| Markdown 保存 | **需要验证** | 当前桌面版不创建 .bak；原子替换仍需用户授权目标目录的访问权限 |

**重要提醒**：macOS App Sandbox 的 Powerbox 机制下，用户通过原生对话框选择的文件会获得临时访问权限。应用需要通过 `NSURLBookmarkCreationWithSecurityScope`（或 Tauri 的对应机制）保存 security-scoped bookmark 以便在后续会话中继续访问该文件。

Tauri 2 的文件访问通过 Rust 的 `std::fs` 实现，在沙盒模式下可能受到限制。**建议在启用沙盒后进行完整的文件读写测试。**

## Entitlements 检查

### 当前状态

- 已新增 App Store 专用 entitlements：`src-tauri/entitlements/app-store.plist`
- 普通 DMG 构建仍不引用该 entitlements
- App Store 构建脚本会生成临时 Tauri config 并引用该 entitlements

### App Store 构建配置

不要直接修改主 `tauri.conf.json`。使用：

```bash
scripts/build-mac-app-store.sh
```

脚本会根据环境变量生成临时 `src-tauri/tauri.appstore.generated.conf.json`，并在退出时删除。

## API 使用审查

### 是否使用了不适合 App Store 的 API

| API/功能 | 状态 | 说明 |
|----------|------|------|
| 文件系统访问 (`std::fs`) | 需沙盒适配 | 标准 POSIX API，沙盒下受限 |
| `dialog:allow-open/save` | 兼容 | Tauri 插件，底层使用 NSOpenPanel |
| CodeMirror 6 | 兼容 | 纯前端组件，无系统 API |
| Milkdown | 兼容 | 纯前端组件，无系统 API |
| Shiki 语法高亮 | 兼容 | 纯前端组件，无系统 API |
| SheetJS (xlsx) | 兼容 | 纯 JS，无系统 API |
| docx.js | 兼容 | 纯 JS，无系统 API |
| `NSWindow` (通过 Tauri) | 兼容 | Tauri 内部使用，标准化 |

### 私有 API 风险

- **无已知私有 API 使用**
- Tauri 2 仅使用 Apple 公开的 AppKit API
- 所有前端功能均基于 Web 标准
- 需在提交前通过 Xcode 的 App Store 验证（`Product → Archive → Validate App`）

## 网络访问

| 场景 | 网络访问 | 说明 |
|------|----------|------|
| 应用启动 | 无 | 纯离线应用 |
| 文件操作 | 无 | 所有操作为本地文件 |
| 导出功能 | 无 | 纯本地生成 |
| 更新检查 | 无 | 当前版本无自动更新功能 |

**结论**：AI 文档快看是完全离线应用，无任何网络请求。
如果上架时需要声明，应标记为"无网络访问"。

## 用户数据收集

| 数据类型 | 是否收集 | 说明 |
|----------|----------|------|
| 个人信息 | 否 | 无需账号、无登录 |
| 使用数据 | 否 | 无埋点、无分析 SDK |
| 崩溃日志 | 否 | 无崩溃报告 SDK |
| 文件内容 | 否 | 所有文件仅在本地处理 |
| 最近文件列表 | 本地 localStorage | 仅存储在用户本地浏览器数据中 |
| 语言偏好 | 本地 settings.json | 存储在应用本地配置目录 |

**结论**：AI 文档快看不收集任何用户数据。
App Store Connect 隐私标签应全部标记为"不收集数据"。

## 隐私清单与隐私声明

### 是否需要

- **隐私清单 (PrivacyInfo.xcprivacy)**：如果不使用需要声明的 API，可以不需要。当前应用无网络、无数据收集、无加密库，可能不需要。
- **隐私政策 URL**：App Store Connect 需要提供隐私政策网址。需要准备一个公开可访问的 URL（如 GitHub Pages 页面）。

### 建议

隐私政策正文以根目录 `PRIVACY_POLICY.md` 为准。提交 App Store 前需要将其发布到公开、无需登录即可访问的 URL。

## 登录 / 账号 / 云同步

- **无登录功能**
- **无账号系统**
- **无云同步**
- 应用是完全本地的单用户工具

在 App Store Connect 的"App 信息"中，可以注明不需要登录。

## App Store Connect 准备材料

### 需要准备的内容

| 材料 | 说明 | 准备状态 |
|------|------|----------|
| App 名称 | `AI 文档快看` | ✅ 已确定 |
| 副标题 / 描述 / 关键词 | 已填写并通过审核 | ✅ |
| 分类 | 已在 App Store Connect 配置 | ✅ |
| 支持网址 | `https://github.com/childhood081/md-quicklook/issues` | ✅ |
| 隐私政策网址 | 已在 App Store Connect 配置并通过审核 | ✅ |
| 截图 | Mac 截图已上传并通过审核 | ✅ |
| 图标 | 1024x1024 PNG | ✅ 已有 `icon.png` |
| App Store 版本号 | `1.0.0 (23)` | ✅ 已审核通过 |

### App Store 截图要求

- Mac App Store 需要至少 **1 张** 截图
- 分辨率：1280x800、1440x900、2560x1600 或 2880x1800 之一
- 格式：PNG 或 JPEG
- 内容：展示应用核心功能（阅读模式、编辑模式、导出功能）

## App Store 元数据草案

### 中文描述方向

AI 文档快看是一款轻量的本地 Markdown 文件阅读与编辑工具。用户可以双击打开 `.md` / `.markdown` 文件，以接近 Word 的阅读样式查看内容，也可以切换到编辑或源码模式进行修改，并支持导出 Word、Excel 和 PDF。文件在本地处理，不需要账号，不上传用户文档。

### 英文描述方向

AI 文档快看 is a lightweight Markdown viewer and editor for local documents. Open `.md` and `.markdown` files quickly, read them in a clean document-style view, switch to editing or source mode when needed, and export content to Word, Excel, or PDF. Files are processed locally, with no account required and no document upload.

### 隐私标签

App Store Connect 隐私标签建议选择：**Data Not Collected / 不收集数据**。

依据：

- 不需要账号；
- 不上传用户文件；
- 不使用广告；
- 不使用分析 SDK；
- 不使用第三方崩溃报告 SDK；
- 文件仅在本地处理或保存到用户选择的位置。

## 当前合规状态

| 检查项 | 状态 | 备注 |
|--------|------|------|
| Bundle ID | ✅ | `com.mdquicklook.desktop` |
| App Store 版本号 | ✅ | `1.0.0 (23)` |
| 图标 | ✅ | `icon.icns` + `icon.png` (1024x1024) |
| App Sandbox | ✅ | 签名包启用了 App Sandbox，并已通过审核 |
| Entitlements | ✅ | App Store 构建脚本生成并签入用户选择文件读写权限 |
| 网络访问声明 | ✅ | 无网络访问 |
| 数据收集声明 | ✅ | 无数据收集 |
| 隐私政策 | ✅ | 已在 App Store Connect 配置并通过审核 |
| 截图 | ✅ | 已上传并通过审核 |
| Apple Developer Program | ✅ | 账号和证书可用 |
| App Store Connect 记录 | ✅ | App ID `6779720577` |
| 签名证书 | ✅ | Apple Distribution 与 Installer 签名成功 |
| Provisioning profile | ✅ | build 23 使用匹配 profile |
| App Review | ✅ | build 23 已通过审核 |

## 当前缺口

1. **手动发布确认** — App Store Connect 正在等待开发者发布，尚未公开。
2. **Security-Scoped Bookmarks** — 最近文件跨进程访问仍可能要求用户重新选择文件。
3. **直接下载签名** — 普通 DMG 仍未使用 Developer ID 签名和公证。
4. **Windows 真机验收** — CI 可构建，但仍需真实 Windows 安装、关联和卸载测试。

## 上架前仍需人工完成的事项

1. 注册 Apple Developer Program
2. 配置签名证书（Xcode 自动管理或不自动管理）
3. 创建 entitlements.plist 并验证沙盒兼容性
4. 在 App Store Connect 创建 App 记录（已完成：`6779720577`）
5. 准备所有元数据（描述、截图、关键词等）
6. 创建隐私政策页面
7. 通过 Xcode Archive 构建并提交
8. 等待 Apple 审核（通常 1-3 天）
9. 审核通过后发布

## App Store 构建脚本

已新增：

```bash
scripts/build-mac-app-store.sh
```

运行前需要设置环境变量。可参考 `.env.example`，不要提交真实密钥。

最小变量：

```bash
export APPSTORE_BUNDLE_IDENTIFIER=com.mdquicklook.desktop
export APPSTORE_MARKETING_VERSION=1.0.0
export APPSTORE_BUILD_NUMBER=<next-build-number>
export APPLE_TEAM_ID=88Y78WLD7A
export APPLE_SIGNING_IDENTITY=EDC962A1E55F41C70B15CC5CC009E32E6A21C50A
export MAC_INSTALLER_SIGNING_IDENTITY=E0A5EC494A3584AE79065A08688507531F6CF8AE
export APPSTORE_PROVISION_PROFILE="/absolute/path/to/profile.provisionprofile"
```

本机 Keychain 中存在同名证书时，建议使用 SHA-1 指纹，避免 `codesign` 或
`productbuild` 报 `ambiguous`。

构建：

```bash
scripts/build-mac-app-store.sh
```

输出：

```text
src-tauri/target/appstore/pkg/AI 文档快看_<marketing-version>_<build-number>_appstore.pkg
```

上传到 App Store Connect / TestFlight 需满足所有前置条件后手动执行：

```bash
xcrun altool --upload-app --type macos \
  --file "src-tauri/target/appstore/pkg/AI 文档快看_1.0.0_<build-number>_appstore.pkg" \
  --apiKey "$APPLE_API_KEY_ID" \
  --apiIssuer "$APPLE_API_ISSUER"
```

每次上传必须递增 `APPSTORE_BUILD_NUMBER`。当前已审核版本是 build 23；只有修复需要替换已审核二进制时才构建 build 24 或更高版本。

## 不上架 Mac App Store 的替代方案

如果不上架 App Store，可以通过以下方式分发：
- **直接 .dmg 分发**（当前已支持）
- GitHub Releases 发布 .dmg
- Homebrew Cask 分发
