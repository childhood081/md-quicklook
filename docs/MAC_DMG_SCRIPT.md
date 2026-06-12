# macOS DMG Script

本文档记录 md-quicklook macOS beta 包的可重复 DMG 构建流程。

## 为什么需要这个脚本

当前 `npx tauri build` 可以稳定生成：

- `src-tauri/target/release/bundle/macos/md-quicklook.app`

但在当前 macOS 16 beta 环境中，Tauri 内部调用的 `create-dmg` 可能在自动 `.dmg` 阶段失败。手动使用系统自带 `hdiutil` 创建 `.dmg` 已验证可行，因此将该步骤脚本化，避免每次人工执行命令时遗漏路径、版本号或安装快捷方式。

## 当前限制

- Tauri 自动 `.dmg` 创建依赖 `create-dmg`，在当前 macOS 16 beta 环境存在兼容风险。
- 脚本生成的 `.dmg` 未签名、未公证，仅适合小范围 beta 测试。
- 脚本当前生成 Apple Silicon `aarch64` 包：`md-quicklook_1.9.0_aarch64.dmg`。
- Windows 安装包仍需在 Windows 实机或 CI 环境单独验证。

## 如何运行

在项目根目录运行：

```bash
scripts/build-macos-dmg.sh
```

脚本会依次执行：

1. `npm run build`
2. `cargo check --manifest-path src-tauri/Cargo.toml`
3. `npx tauri build`
4. 使用 `hdiutil` 从生成的 `.app` 创建最终 beta `.dmg`

如果 `npx tauri build` 在自动 `.dmg` 阶段失败，但 `.app` 已经生成，脚本会继续执行 `hdiutil` fallback。

## 输出路径

```text
src-tauri/target/release/bundle/dmg/md-quicklook_1.9.0_aarch64.dmg
```

脚本会自动创建 `dmg` 目录，并在生成前删除同名旧 `.dmg`。

## DMG 内容

生成的 `.dmg` 包含：

- `md-quicklook.app`
- `Applications` 快捷方式

用户可以打开 `.dmg` 后将 `md-quicklook.app` 拖入 `Applications`。

## 如何测试挂载

```bash
hdiutil attach src-tauri/target/release/bundle/dmg/md-quicklook_1.9.0_aarch64.dmg
ls -la /Volumes/md-quicklook
hdiutil detach /Volumes/md-quicklook
```

预期能看到：

```text
md-quicklook.app
Applications
```

## 如何安装

1. 双击打开 `.dmg`。
2. 将 `md-quicklook.app` 拖到 `Applications`。
3. 从 `Applications` 启动应用。
4. 如遇 Gatekeeper 阻止，右键点击应用并选择 Open。

## 未签名 / 未公证说明

当前 beta 包没有 Developer ID 签名，也没有 Notarization。

影响：

- 首次启动时 macOS 可能提示无法验证开发者。
- 用户需要通过右键 Open 或移除 quarantine 标记来启动。
- 不建议直接面向公开用户发布。

后续正式发布前应补齐：

- Developer ID Application 签名
- Notarization
- `spctl -a -v` 验证
- DMG 签名或公证票据 staple 验证
