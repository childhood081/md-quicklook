# Windows Distribution

Windows 安装包构建与分发指南 — 涵盖 NSIS 安装程序和 .msi 安装包。

## Windows 1.9.2 测试安装包（2026-10-26）

- 下载：[NSIS 安装包 ZIP](https://github.com/childhood081/md-quicklook/actions/runs/40298324220/artifacts/12638859979)（GitHub Actions artifact，可能需要登录，非永久 Release 下载）。
- 解压后运行 `md-quicklook_1.9.2_x64-setup.exe`。不要使用裸 `md-quicklook.exe` 代替安装器。
- 构建源码提交：`5a4aa62fd930dca56de676e8bae05ebc3790ba5c`；分支 `fix/windows-1.9.2-document-tabs`，未合并 main，未发布 Release，未运行 Mac 构建。
- [Windows 构建与原有安装回归](https://github.com/childhood081/md-quicklook/actions/runs/40298324220)：22 项前端状态测试、6 项 Rust 测试、前端构建、Rust 检查、Tauri 构建均通过。
- [复用同一安装包的标签 / 关闭 / 历史原生回归](https://github.com/childhood081/md-quicklook/actions/runs/40299355333)：测试脚本提交 `d67f443`，仅增加测试，不改变安装包。
- 实际安装后的 `FileVersion` / `ProductVersion` 均为 `1.9.2`，`ProductName` 保持 `md-quicklook`，应用窗口显示“AI 文档快看”。
- 安装器 SHA-256：`96f5d74895eff264ab934d241dca98e5f82e0f966414a5671355be577b3fc347`。

原生 CI 验证通过：中文 / 空格路径 Shell 冷启动、运行中打开 `.markdown`、单实例两个标签、关闭第二个标签、关闭最后标签返回欢迎页及历史、历史重开、CLI 打开、可执行文件 Open With 注册打开；打开文件不新增 `.md.bak`。

测试环境是 GitHub Windows Server 2025，不替代用户 Windows 10/11 的最终验收。PDF 打印驱动的建议文件名、Word 自身的 `~$` 锁文件行为和真实文档的连续中文输入仍需在用户机器检查。未签名安装器可能触发 SmartScreen 提示。

## 构建命令

### 前置条件

```bash
# 安装 Rust Windows target（如尚未安装）
rustup target add x86_64-pc-windows-msvc
```

### 在 macOS 上交叉编译（有限支持）

macOS 上交叉编译 Windows 需要额外的链接器配置，较为复杂。
**建议**：在 Windows 机器上构建 Windows 安装包，或在 CI/CD 中构建。

### 在 Windows 上构建

```bash
# 前端构建
npm run build

# 完整 Tauri 构建
npx tauri build
```

## 产物位置

| 产物 | 路径 |
|------|------|
| NSIS .exe | `src-tauri/target/release/bundle/nsis/md-quicklook_1.9.2_x64-setup.exe`（指定 target 时位于 `target/x86_64-pc-windows-msvc/` 下） |
| .msi | 当前未交付、未做本轮安装回归 |

> 当前流水线的全量打包可能生成 WiX MSI，`windows.wix: null` 并不等于禁止 MSI。当前只上传和验证 NSIS EXE，文件关联修复依赖 NSIS hooks，请勿将未验证 MSI 当作本轮交付包。

## NSIS 配置说明

### 当前配置（tauri.conf.json）

```json
{
  "bundle": {
    "windows": {
      "wix": null,
      "nsis": {
        "installMode": "currentUser",
        "installerIcon": "icons/icon.ico",
        "languages": ["English", "SimpChinese"],
        "displayLanguageSelector": false,
        "startMenuFolder": "AI 文档快看"
      }
    }
  }
}
```

### 配置字段说明

| 字段 | 值 | 说明 |
|------|-----|------|
| `installMode` | `currentUser` | 仅当前用户，无需管理员权限 |
| `installerIcon` | `icons/icon.ico` | 安装程序图标 |
| `languages` | `["English", "SimpChinese"]` | 安装界面语言（中英文） |
| `displayLanguageSelector` | `false` | 不显示语言选择器，自动匹配系统语言 |
| `startMenuFolder` | `AI 文档快看` | 开始菜单文件夹名称 |

## 文件关联注册

### 当前配置

```json
{
  "fileAssociations": [
    {
      "ext": ["md", "markdown"],
      "name": "com.mdquicklook.desktop.Markdown",
      "description": "Markdown document",
      "role": "Editor"
    }
  ]
}
```

NSIS 安装程序会自动注册以下文件关联：
- `.md` → Markdown document → AI 文档快看
- `.markdown` → Markdown document → AI 文档快看

### 安装后双击 .md 行为

1. **未运行时**：双击 .md 启动 AI 文档快看并打开该文件
2. **已运行时**：双击 .md 会把 CLI args 中的文件路径转发给已有窗口，并将窗口恢复、置前。

> 注意：Tauri 2 中不使用旧运行时打开事件处理 Windows 文件关联；冷启动依赖
> `find_markdown_files()` 扫描全部文件参数，启动队列由前端 `initial_files` 读取；已有实例由 `tauri-plugin-single-instance` 转发参数。

### 单实例行为

Windows 版本使用 Tauri 2 的 `tauri-plugin-single-instance`。重复启动应用或在资源管理器中
双击另一个 Markdown 文件时，不创建第二个独立窗口，而是复用已有窗口并打开新文件。

## 安装测试步骤

### 全新安装

1. 双击 `md-quicklook_1.9.2_x64-setup.exe`
2. 确认安装路径
3. 安装完成后：
   - 确认桌面快捷方式存在
   - 确认开始菜单中有 `AI 文档快看` 文件夹
4. 从桌面快捷方式启动应用

### 升级安装

1. 运行新版安装程序
2. 安装程序自动覆盖旧版
3. 用户配置（settings.json）保留

### 文件关联测试

1. 在文件资源管理器找到任意 `.md` 文件
2. 右键 → **Open with** → 选择 **AI 文档快看** → **Always**
3. 双击 `.md` 文件，确认在 AI 文档快看中打开
4. 对 `.markdown` 文件重复步骤
5. 应用运行时，再次双击另一个 `.md`，确认文件正确打开

### Windows 1.9.1 默认打开修复

Windows 专用配置位于 `src-tauri/tauri.windows.conf.json`。该配置只把 Windows
安装包版本设为 1.9.1，保留 `productName: md-quicklook` 和原 Bundle ID；
macOS / App Store 的版本及配置不变。

文件类型标识改为 `com.mdquicklook.desktop.Markdown`，避免与其他软件的通用
`Markdown` ProgID 共用注册表项。NSIS 的 `windows/hooks.nsh` 同时注册：

- 文档 ProgID 的 `shell/open/command`。
- `Applications/md-quicklook.exe` 的打开命令及 `.md` / `.markdown` 支持列表。
- Windows 设置中使用的 `RegisteredApplications` 和 `Capabilities`。

两种打开命令都明确使用 `"完整程序路径" "%1"`。升级安装会重写本应用的
可执行文件打开记录；仅在旧 `Markdown` ProgID 仍引用 `md-quicklook.exe` 时
修复它，不替换其他编辑器的打开命令。安装器不会写入或绕过 Windows 的
`UserChoice` 默认程序保护；默认选择仍由用户在 Windows 中确认。

`scripts/test-windows-file-association.ps1` 只用于隔离的 Windows 测试机器，
会真实安装 NSIS 包、预置旧的缺少文件参数的打开记录，并用 Windows Shell
打开含中文和空格路径的 `.md` / `.markdown`。测试通过 UI Automation 检查
正文标记，并保留进程命令行、界面文本和截图。Release Build 在安装测试
通过后才上传可下载的安装包。`windows-installed-test` 选项还可复测旧产物。

若某台机器升级后仍停在欢迎页，使用只读脚本查询真正生效的默认打开命令：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\diagnose-windows-file-association.ps1
```

报告默认写到桌面的 `AI-Doc-QuickLook-file-association.json`。脚本通过
`AssocQueryString` 查询实际解析结果，同时列出 UserChoice、旧 ProgID 和
可执行文件打开项；不改默认程序、不启动文件、不读取 Markdown 内容。
报告包含安装路径，分享前可遮盖 Windows 用户名。

实现依据：[Microsoft Application Registration](https://learn.microsoft.com/en-us/windows/win32/shell/app-registration)、
[Tauri NSIS hooks](https://v2.tauri.app/distribute/windows-installer/#extending-the-installer)、
[项目使用的 Tauri 2.11.2 NSIS 模板](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.2/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi)。

### 2026-10-23 安装后的回归验证

在 GitHub Windows runner 中，旧的 1.9.0 安装包通过了普通 Shell 冷启动、热启动和
直接 CLI 打开测试。但预置 `Applications\md-quicklook.exe\shell\open\command`
仅含程序路径、没有 `%1` 后，重新安装旧包不会修复它。使用 Windows
`ShellExecuteEx` 的 `SEE_MASK_CLASSKEY` 指定该注册项时，可复现应用停在欢迎页：
进程命令行只有程序路径，没有所选文档。对应的界面文本和截图也显示“选择文件”。

[旧包对照测试及证据](https://github.com/childhood081/md-quicklook/actions/runs/39893024410)
中的专项测试失败是预期的复现结果，不代表前三项测试失败。这证明旧注册记录是
一种可复现原因；是否就是某台用户机器上的原因，仍应以只读诊断报告为准。

专项测试不把 `Applications\...` 临时写成扩展名的默认值，不修改受 Windows
保护的 `UserChoice`。它直接调用注册类，避免将测试方法本身的问题误判为应用错误。

同一测试脚本在新 1.9.1 NSIS 包上全部通过：

| 场景 | 旧 1.9.0 | 新 1.9.1 |
| --- | --- | --- |
| 中文、空格路径的 `.md`，Shell 冷启动 | 正文可见 | 正文可见 |
| 已运行时打开另一个 `.markdown` | 正文可见 | 正文可见，保持单实例 |
| 直接 CLI 传入文档路径 | 正文可见 | 正文可见 |
| 预置缺少 `%1` 的旧应用打开记录，安装后从该记录打开 | 停在欢迎页，命令行无文档路径 | 正文可见，命令行含所选文档 |

[1.9.1 构建、安装回归测试和截图](https://github.com/childhood081/md-quicklook/actions/runs/39893026381)
对应应用/测试代码提交 `bf5468a`。测试运行于 Windows Server 2025 的 GitHub
runner，尚不能替代用户实际 Windows 10/11 机器的最终确认。

验收时请使用 `md-quicklook_1.9.1_x64-setup.exe`，在 Windows 默认应用中
确认 `.md` 和 `.markdown` 均指向该次安装的“AI 文档快看”，退出应用后双击文件。

### 卸载测试

1. 通过 Windows 设置 → **Apps** → 找到 AI 文档快看 → **Uninstall**
2. 或通过开始菜单 → AI 文档快看 → **Uninstall**
3. 确认：
   - 应用文件已删除
   - 桌面快捷方式已移除
   - 开始菜单文件夹已移除
   - 用户数据（settings.json、recent files）可能需要手动清理

## 已知限制

### Windows 特定限制

1. **`currentUser` 安装模式**
   - 仅为当前用户安装
   - 如需全局安装（所有用户），改为 `installMode: "perMachine"`，但需要管理员权限

2. **本轮仅提供 NSIS 安装包**
   - `tauri build` 实际也可能生成 MSI；`wix: null` 不等于禁用 MSI 打包
   - 本次升级修复钩子和安装后回归测试仅覆盖 NSIS `.exe`，工作流不提供 MSI 下载
   - MSI 的注册/升级行为需要另行验证，不能假定它包含 NSIS 钩子的修复

3. **卸载残留**
   - 用户数据（`%APPDATA%/com.mdquicklook.desktop/`）在卸载时不会自动清理
   - 这是 NSIS `currentUser` 模式的默认行为

4. **文件关联卸载恢复**
   - 卸载后 .md 文件关联不会自动恢复为之前的程序
   - 用户需要手动重新关联

## 代码签名

### 证书类型对比

Windows 代码签名证书分为两种级别，对 SmartScreen 信誉影响不同：

| 属性 | Standard Code Signing | EV Code Signing |
|------|----------------------|-----------------|
| 颁发机构 | DigiCert / Sectigo / GlobalSign | DigiCert / Sectigo (严格审核) |
| 颁发速度 | 1-3 个工作日 | 3-7 个工作日 |
| 验证要求 | 组织验证 (OV) | 扩展验证 (EV)：法人实体 + 物理地址 + 电话 |
| 硬件需求 | 可在软件中存储 (.pfx) | **必须**使用硬件 token (USB Key) 或 HSM |
| 签名方式 | `signtool sign /f cert.pfx /p <pwd>` | 通过硬件 token (Safenet eToken / YubiKey HSM) |
| SmartScreen 信誉 | 需要较长时间积累 | **即时建立** SmartScreen 信誉 |
| 年费参考 | $200-$400/年 | $300-$600/年 |
| 适用场景 | 个人开发者、小团队内部工具 | 面向公众分发的商业软件 |

> 关键差异：EV 证书签名后 SmartScreen 立即移除"Windows protected your PC"警告。
> Standard 证书需要积累足够的下载/安装量和时间才能建立信誉（通常数周至数月）。

### 证书供应商

常见 Windows 代码签名证书供应商：

- **DigiCert**: https://www.digicert.com/code-signing/ — 市场占有率最高，Microsoft 推荐
- **Sectigo**: https://sectigo.com/ssl-certificates-tls/code-signing — 性价比高
- **GlobalSign**: https://www.globalsign.com/en/code-signing-certificate — 企业方案成熟
- **SSL.com**: https://www.ssl.com/certificates/code-signing/ — 支持 eSigner 云签名

### CI/CD 中的签名方式

#### 方案 A：PFX 文件（仅 Standard 证书）

```json
{
  "bundle": {
    "windows": {
      "signCommand": "signtool sign /fd SHA256 /f certificate.pfx /p %CERT_PASSWORD% %1"
    }
  }
}
```

GitHub Actions 中使用 secrets：

```yaml
- name: Build and sign Windows
  env:
    CERT_PASSWORD: ${{ secrets.WINDOWS_CERT_PASSWORD }}
  run: npx tauri build --target x86_64-pc-windows-msvc
```

> 注意：PFX 证书文件需以 base64 存入 GitHub Secrets，在工作流中解码写入临时文件。
> 安全风险较高，建议仅用于 CI 环境。

#### 方案 B：Azure Key Vault（EV 证书推荐）

```json
{
  "bundle": {
    "windows": {
      "signCommand": "azuresigntool sign -kvu https://your-vault.vault.azure.net -kvc your-cert-name %1"
    }
  }
}
```

GitHub Actions 中使用 Azure 服务主体：

```yaml
- name: Azure login
  uses: azure/login@v2
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

- name: Build and sign Windows
  run: npx tauri build --target x86_64-pc-windows-msvc
```

#### 方案 C：SSL.com eSigner（云签名）

```json
{
  "bundle": {
    "windows": {
      "signCommand": "escsign sign /a "ESR" /url https://api.ssl.com/codesigning/v1 /username %ES_USERNAME% /password %ES_PASSWORD% /credential_id %ES_CREDENTIAL_ID% %1"
    }
  }
}
```

> 优点：无需物理硬件，证书存储在云端 HSM 中。

### 当前状态

| 项目 | 状态 |
|------|------|
| 代码签名证书 | **无** |
| 签名配置 | **未配置** |
| SmartScreen 信誉 | **无** |

## SmartScreen 风险与缓解

### SmartScreen 拦截流程

Windows Defender SmartScreen 对未签名或信誉不足的安装程序会显示以下警告：

```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
Running this app might put your PC at risk.
```

用户需要点击 **More info** → **Run anyway** 才能继续安装。

### SmartScreen 信誉建立过程

SmartScreen 信誉是通过累积信号自动建立的，无人工审核通道：

1. **初始状态**（无签名/未知签名）：首次出现时触发强警告，"More info → Run anyway"需要多次点击
2. **信誉积累期**（有签名但信誉低）：警告逐渐减弱，从"阻止"降级为"提醒"
3. **信誉建立**（足够的下载+安装量）：警告消失，正常安装

关键信号 Microsoft 用于评估信誉：
- 签名证书的有效性和类型（EV > Standard）
- 文件的下载量和安装量
- 用户选择"Run anyway"后**不卸载**的留存率
- 文件的病毒扫描结果（Windows Defender、第三方 AV）
- 是否有恶意行为报告

### 无签名状态下的 Beta 测试策略

当前 AI 文档快看未签名。面向内部测试用户分发时的建议：

**1. 预先告知**
向测试用户明确说明：
- 安装程序未签名，会触发 SmartScreen 警告
- 这是正常现象，不是安全问题
- 提供绕过警告的截图步骤

**2. 提供校验和**
发布时附带 SHA256 校验文件，让用户可以验证下载完整性：
```powershell
# 生成校验和
certutil -hashfile "AI 文档快看_1.9.0_x64-setup.exe" SHA256
# 或使用 PowerShell
Get-FileHash "AI 文档快看_1.9.0_x64-setup.exe" -Algorithm SHA256
```

**3. 安装说明文档**
为测试用户准备简洁的安装说明，包含 SmartScreen 绕过的截图。

**4. 限制分发范围**
- 通过内部渠道分发（私有 GitHub Release、内部网盘），避免在公开网站提供下载
- 未签名的安装程序在浏览器下载时也会触发 SmartScreen 警告（Edge / Chrome 均如此）

**5. 收集反馈**
追踪测试用户是否因 SmartScreen 警告放弃安装，评估对签名证书投资的紧迫性。

### 正式发布前的签名投入评估

| 投入 | 无签名 | Standard 证书 | EV 证书 |
|------|--------|---------------|---------|
| 年费 | $0 | $200-$400 | $300-$600 |
| 申请时间 | 0 | 1-3 天 | 3-7 天 |
| 硬件需求 | 无 | 无 | 需 USB Token |
| SmartScreen 初始状态 | 强警告 | 中等警告 | 无警告 |
| SmartScreen 信誉建立 | 永远不会 | 数周至数月 | 即时 |
| 用户体验 | 差 | 一般 | 好 |
| 适合 | 内部工具、个人项目 | 小众开源项目 | 面向公众的商业软件 |

> 建议：当前 beta 阶段以无签名方式内部测试。确认产品稳定度并积累用户反馈后，再根据分发规模决定证书投入。

## CI/CD 构建

GitHub Actions 工作流已配置于 `.github/workflows/release-build.yml`。

### 手动触发

```bash
gh workflow run release-build.yml -f target=all
# 或指定单平台
gh workflow run release-build.yml -f target=windows-only
```

产物可在 Actions 运行页面的 Artifacts 区域下载。

### 本地 Windows 构建

```bash
# 在 Windows 机器上
npm install
npm run build
npx tauri build --target x86_64-pc-windows-msvc
```

产物位置：

| 产物 | 路径 |
|------|------|
| NSIS 安装程序 | `src-tauri/target/release/bundle/nsis/AI 文档快看_1.9.0_x64-setup.exe` |
| 未打包的 .exe | `src-tauri/target/release/md-quicklook.exe` |
