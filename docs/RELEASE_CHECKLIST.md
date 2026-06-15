# Release Checklist

AI 文档快看发布前验证清单。

## 每次发布前必检

## 当前发布状态

- 当前建议对外标记为 `v1.9.0-beta`。
- `tauri.conf.json` / `Cargo.toml` 可继续使用 `1.9.0` 作为内部构建版本。
- macOS beta 包未签名、未公证，只适合小范围测试。
- Windows 安装包尚未在真实 Windows 环境构建和验证。
- Mac App Store 尚未上架，App Store Sandbox / entitlements / 审核材料未完成。

## 版本命名建议

当前配置中的 `1.9.0` 已经被 Tauri 和 Cargo 接受，也会进入 macOS bundle metadata。发布沟通建议使用：

```text
v1.9.0-beta
```

理由：

- 不需要立刻改动 Tauri / Cargo 的 semver 字段，降低发布包配置风险。
- 能明确告诉测试用户这是 beta，而不是正式版。
- 保留现有 V1.4-V1.9 的内部迭代编号，方便和项目历史对应。

如果后续决定改为 `1.0.0-beta.1`，需要同步修改：

- `package.json` 的 `version`
- `src-tauri/Cargo.toml` 的 `package.version`
- `src-tauri/tauri.conf.json` 的 `version`
- 原生菜单 About 文案中展示的版本号（如存在硬编码）
- `CHANGELOG.md`
- 发布包文件名和文档中的版本路径

### 构建验证

- [ ] `npm run build` 通过（vue-tsc + vite build）
- [ ] `cargo check` 通过（Rust 编译检查）
- [ ] `npx tauri build` 生成 `.app`；如自动 `.dmg` 因 create-dmg 失败，使用 `scripts/build-macos-dmg.sh`
- [ ] `scripts/build-macos-dmg.sh` 通过并生成可挂载 beta `.dmg`

### macOS 验证

- [ ] `AI 文档快看.app` 可正常启动
- [ ] `.dmg` 可正常挂载和安装到 `/Applications`
- [ ] `.dmg` 内包含 `AI 文档快看.app`
- [ ] `.dmg` 内包含 `Applications` 快捷方式
- [ ] 未签名 .app 的 Gatekeeper 绕过路径已验证
- [ ] `.md` 文件关联正常（右键 → Open with）
- [ ] `.markdown` 文件关联正常
- [ ] 已运行时双击 .md 文件能正确打开

### Windows 验证

- [ ] NSIS 安装程序生成成功
- [ ] 安装程序可正常安装到 `%LOCALAPPDATA%`
- [ ] 桌面快捷方式创建正确
- [ ] 开始菜单文件夹包含应用和卸载入口
- [ ] `.md` 文件关联注册成功
- [ ] `.markdown` 文件关联注册成功
- [ ] 卸载功能正常（不残留垃圾文件）

### 功能验证

- [ ] 打开 .md 文件：阅读模式正常渲染
- [ ] 打开 .markdown 文件：阅读模式正常渲染
- [ ] 编辑模式：Milkdown WYSIWYG 编辑器正常
- [ ] 源码模式：CodeMirror 6 编辑器正常
- [ ] 模式切换：阅读 ↔ 编辑 ↔ 源码
- [ ] 目录面板：标题提取和跳转正常
- [ ] 保存：手动保存和自动保存均正常
- [ ] Word 导出：生成 .docx 文件内容正确
- [ ] Excel 导出：表格提取、多 sheet、数字列识别正确
- [ ] 导出路径选择：对话框正常，取消不报错
- [ ] 无表格文档导出 Excel：显示提示，不生成空文件

### i18n 验证

- [ ] 原生菜单：中文 ↔ English 切换正常
- [ ] 前端界面：工具栏、按钮、欢迎页、目录跟随语言切换
- [ ] 语言切换后不丢失文件内容、模式、保存状态
- [ ] 重新启动后语言偏好持久化

### 导出功能验证

- [ ] Word 导出文件可用 Word/WPS/LibreOffice 打开
- [ ] Excel 导出文件可用 Excel/WPS/LibreOffice 打开
- [ ] 中文内容不乱码

## 签名与公证（如有证书）

- [ ] macOS：Developer ID 签名状态
- [ ] macOS：Notarization 状态（`spctl -a -v`）
- [ ] Windows：代码签名状态（`signtool verify /pa`）

## App Store 准备（如适用）

- [ ] entitlements.plist 已配置
- [ ] App Sandbox 文件读写已验证
- [ ] App Store Connect 元数据已准备
- [ ] 截图已更新
- [ ] 隐私政策 URL 可访问

## 文档

- [ ] CHANGELOG.md 已更新
- [ ] docs/KNOWN_LIMITATIONS.md 已更新
- [ ] docs/RELEASE_CHECKLIST.md 已更新
- [ ] README.md 功能列表与版本号最新

## 版本号一致性

- [ ] `tauri.conf.json` `version` 字段
- [ ] `Cargo.toml` `version` 字段
- [ ] `menu.rs` About 对话框 `version` 字段
- [ ] 以上三者一致
