# Windows Distribution

Windows 安装包构建与分发指南 — 涵盖 NSIS 安装程序和 .msi 安装包。

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
| .exe | `src-tauri/target/release/bundle/nsis/md-quicklook_1.9.0_x64-setup.exe` |
| .msi | `src-tauri/target/release/bundle/msi/md-quicklook_1.9.0_x64_en-US.msi` |

> 注意：当前配置禁用了 WiX (.msi)，仅生成 NSIS (.exe) 安装程序。
> 如需 .msi，将 `windows.wix` 从 `null` 改为 `{}`。

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
        "startMenuFolder": "md-quicklook"
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
| `startMenuFolder` | `md-quicklook` | 开始菜单文件夹名称 |

## 文件关联注册

### 当前配置

```json
{
  "fileAssociations": [
    {
      "ext": ["md", "markdown"],
      "name": "Markdown",
      "description": "Markdown document",
      "role": "Editor"
    }
  ]
}
```

NSIS 安装程序会自动注册以下文件关联：
- `.md` → Markdown document → md-quicklook
- `.markdown` → Markdown document → md-quicklook

### 安装后双击 .md 行为

1. **未运行时**：双击 .md 启动 md-quicklook 并打开该文件
2. **已运行时**：双击 .md 通常会启动新实例并通过 CLI args 传入文件路径。

> 注意：Tauri 2 中不使用旧运行时打开事件处理 Windows 文件关联；当前实现依赖
> `src-tauri/src/lib.rs` 中的 `find_markdown_file_in_args()`。

### 多实例限制

当前版本**不限制多实例**。用户可以同时打开多个 md-quicklook 窗口。
每个窗口独立运行，互不影响。

如需限制单实例，可在 `tauri.conf.json` 中配置：

```json
{
  "app": {
    "windows": [
      {
        "title": "md-quicklook"
      }
    ]
  },
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["md-quicklook"]
      }
    }
  }
}
```

> 单实例限制目前不是需求，保持多实例行为。

## 安装测试步骤

### 全新安装

1. 双击 `md-quicklook_1.9.0_x64-setup.exe`
2. 确认安装路径（默认为 `%LOCALAPPDATA%\md-quicklook`）
3. 安装完成后：
   - 确认桌面快捷方式存在
   - 确认开始菜单中有 `md-quicklook` 文件夹
4. 从桌面快捷方式启动应用

### 升级安装

1. 运行新版安装程序
2. 安装程序自动覆盖旧版
3. 用户配置（settings.json）保留

### 文件关联测试

1. 在文件资源管理器找到任意 `.md` 文件
2. 右键 → **Open with** → 选择 **md-quicklook** → **Always**
3. 双击 `.md` 文件，确认在 md-quicklook 中打开
4. 对 `.markdown` 文件重复步骤
5. 应用运行时，再次双击另一个 `.md`，确认文件正确打开

### 卸载测试

1. 通过 Windows 设置 → **Apps** → 找到 md-quicklook → **Uninstall**
2. 或通过开始菜单 → md-quicklook → **Uninstall**
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

2. **无 .msi 输出**
   - 当前禁用 WiX，仅生成 NSIS
   - 企业部署可能需要 .msi 格式
   - 启用 WiX 需要安装 WiX Toolset

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

当前 md-quicklook 未签名。面向内部测试用户分发时的建议：

**1. 预先告知**
向测试用户明确说明：
- 安装程序未签名，会触发 SmartScreen 警告
- 这是正常现象，不是安全问题
- 提供绕过警告的截图步骤

**2. 提供校验和**
发布时附带 SHA256 校验文件，让用户可以验证下载完整性：
```powershell
# 生成校验和
certutil -hashfile md-quicklook_1.9.0_x64-setup.exe SHA256
# 或使用 PowerShell
Get-FileHash md-quicklook_1.9.0_x64-setup.exe -Algorithm SHA256
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
| NSIS 安装程序 | `src-tauri/target/release/bundle/nsis/md-quicklook_1.9.0_x64-setup.exe` |
| 未打包的 .exe | `src-tauri/target/release/md-quicklook.exe` |
