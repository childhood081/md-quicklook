# Privacy Policy / 隐私政策

**md-quicklook** — 轻量 Markdown 文件阅读与编辑工具

> 本文档为隐私政策草案，正式发布前需托管到公开可访问的 URL（如 GitHub Pages）。
> 最后更新日期：2026-06-12

公开 URL 状态：**未准备**。

App Store Connect 提交前必须提供真实、公开、无需登录即可访问的隐私政策 URL。不要填写占位 URL 或不可访问的私有链接。

---

## English

### Our Commitment to Privacy

md-quicklook is designed with privacy as a foundational principle. We believe you should be able to work with your files without anyone watching.

### Data We Do NOT Collect

md-quicklook does **not** collect, store, or transmit any of the following:

- **Personal information** — No name, email address, phone number, or any other personally identifiable information.
- **Account credentials** — No account registration or login is required. The app has no account system.
- **File contents** — All Markdown files you open remain on your local device. File content is never uploaded to any server.
- **Usage data** — No analytics, no telemetry, no tracking of how you use the app.
- **Device information** — No device identifiers, no system profiling.
- **Location data** — No location services are used.
- **Crash reports** — No automatic crash reporting SDK is included.

### How Your Data Is Handled

- **File reading and writing**: All file operations happen exclusively on your local device. When you open a `.md` file, the app reads it directly from your filesystem. When you save, the app writes directly to your filesystem using atomic writes (temp-file + rename) to prevent data loss.
- **Export functionality**: Word (.docx) and Excel (.xlsx) exports are generated entirely on your local device and saved to a location you choose through the system save dialog.
- **Preferences**: Your language preference and recent file list are stored locally on your device — in the app's configuration directory (`settings.json`) and in the browser's `localStorage`, respectively. This data never leaves your device.
- **No network access**: The app does not make any network requests. It works completely offline.

### Third-Party Services

md-quicklook does **not** integrate any of the following:

- Third-party analytics SDKs
- Advertising networks
- Crash reporting services
- Cloud synchronization services
- External authentication providers

### Changes to This Policy

If md-quicklook adds new features that affect data handling (such as optional cloud synchronization), this privacy policy will be updated before those features are released. Users will be notified of material changes through the app's update mechanism or the project's public channels.

### Contact

For questions about this privacy policy, please open an issue on the project's GitHub repository.

---

## 简体中文

### 我们对隐私的承诺

md-quicklook 从设计之初就将隐私保护作为基本原则。我们相信你可以在不被监视的情况下处理你的文件。

### 我们不收集的数据

md-quicklook **不**收集、存储或传输以下任何数据：

- **个人信息** — 不收集姓名、邮箱地址、电话号码或任何其他可识别个人身份的信息。
- **账号凭据** — 无需注册或登录。本应用没有账号系统。
- **文件内容** — 你打开的所有 Markdown 文件仅保留在你的本地设备上。文件内容不会被上传到任何服务器。
- **使用数据** — 没有分析统计，没有遥测，不追踪你如何使用本应用。
- **设备信息** — 不获取设备标识符，不进行系统分析。
- **位置数据** — 不使用定位服务。
- **崩溃报告** — 不包含自动崩溃报告 SDK。

### 数据处理方式

- **文件读写**：所有文件操作仅在本地设备上进行。当你打开 `.md` 文件时，应用直接从你的文件系统读取。当你保存时，应用使用原子写入（临时文件 + 重命名）直接写入你的文件系统，防止数据丢失。
- **导出功能**：Word (.docx) 和 Excel (.xlsx) 导出完全在你的本地设备上生成，并保存到你通过系统保存对话框选择的位置。
- **偏好设置**：你的语言偏好和最近文件列表存储在本地设备上 — 分别在应用的配置目录（`settings.json`）和浏览器的 `localStorage` 中。这些数据不会离开你的设备。
- **无网络访问**：本应用不进行任何网络请求，可完全离线运行。

### 第三方服务

md-quicklook **不**集成以下任何服务：

- 第三方分析 SDK
- 广告网络
- 崩溃报告服务
- 云同步服务
- 外部认证提供商

### 本政策的变更

如果 md-quicklook 未来加入影响数据处理的新功能（如可选的云同步），本隐私政策将在这些功能发布前更新。重大变更将通过应用的更新机制或项目的公开渠道通知用户。

### 联系方式

对本隐私政策有任何疑问，请在项目的 GitHub 仓库提交 Issue。

---

## App Store Connect Privacy Labels

| Data Type | Collected? | Purpose |
|-----------|-----------|---------|
| Contact Info | No | — |
| Health & Fitness | No | — |
| Financial Info | No | — |
| Location | No | — |
| Sensitive Info | No | — |
| Contacts | No | — |
| User Content | No | Files processed locally only |
| Browsing History | No | — |
| Search History | No | — |
| Identifiers | No | — |
| Purchases | No | — |
| Usage Data | No | — |
| Diagnostics | No | — |
| Other Data | No | — |

**All categories: "Data Not Collected".**

---

## 未来功能扩展时的政策更新义务

如果在后续版本中引入以下功能，隐私政策需要同步更新：

- **云同步功能**：需说明同步服务提供方、数据传输加密方式、数据存储位置。
- **自动更新**：需说明更新检查是否涉及网络请求、是否传输设备信息。
- **崩溃报告**：需说明收集的数据类型、传输方式、数据保留期限。
- **用户反馈入口**：如加入反馈表单，需说明提交数据的使用方式。
