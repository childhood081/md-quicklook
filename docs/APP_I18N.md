# App Internationalization (i18n)

md-quicklook 全应用中英双语架构文档。

## 架构概览

```
┌──────────────────────────────────────────────────┐
│                  Native Menu (Rust)                 │
│  menu.rs: build_menu_zh() / build_menu_en()        │
│  language persisted to settings.json                │
│  emits "language-changed" event on switch           │
└──────────────────┬───────────────────────────────┘
                   │ Tauri event
                   ▼
┌──────────────────────────────────────────────────┐
│                App.vue (Vue frontend)              │
│  onMounted: invoke('get_language') → setLocale()  │
│  listen('language-changed') → setLocale()          │
└──────────────────┬───────────────────────────────┘
                   │ i18n.global.locale.value = 'zh-CN' | 'en-US'
                   ▼
┌──────────────────────────────────────────────────┐
│           vue-i18n (Composition API mode)          │
│  src/i18n/index.ts: createI18n({ legacy: false })  │
│  src/i18n/locales/zh-CN.ts ← 中文翻译              │
│  src/i18n/locales/en-US.ts ← English translations  │
└──────────────────┬───────────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
  Components    Store          Utils
  $t() /       i18n.global    i18n.global
  useI18n()    .t()           .t()
```

## 文件结构

```
src/i18n/
├── index.ts              # createI18n instance + setLocale()/getLocale()
├── locales/
│   ├── zh-CN.ts          # ~70 中文翻译条目
│   └── en-US.ts          # ~70 English translation entries
```

## 翻译键（Translation Keys）

所有翻译键按功能域分组：

| 域 | 键前缀 | 说明 |
|---|---|---|
| app | `app.*` | 应用名称 |
| mode | `mode.*` | 阅读/编辑/源码模式名称 |
| toolbar | `toolbar.*` | 工具栏按钮、导出状态 |
| save | `save.*` | 保存状态文案 |
| welcome | `welcome.*` | 欢迎页所有文案 |
| outline | `outline.*` | 目录面板 |
| dialog | `dialog.*` | 文件对话框标题、过滤器名称 |
| export | `export.*` | 导出操作相关文案 |
| editor | `editor.*` | 富文本编辑器工具栏 |
| error | `error.*` | 错误提示文案 |
| help | `help.*` | 帮助菜单文案 |
| source | `source.*` | 源码编辑器 |

## 使用方式

### Vue 组件中（模板）

```html
<button>{{ $t('toolbar.save') }}</button>
```

### Vue 组件中（脚本）

```typescript
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
showSuccess(t('save.fileSaved'))
```

### Pinia Store / 非组件代码

```typescript
import { i18n } from '../i18n'
throw new Error(i18n.global.t('error.needOpenFile'))
```

## 语言切换流程

1. 用户点击原生菜单 → `语言 (Language)` → 选择语言
2. Rust 后端 `switch_language` 命令：
   - 更新 `AppState.config` 中的语言设置
   - 持久化到 `settings.json`
   - 重建原生菜单（菜单文字立即切换）
   - 发送 `language-changed` 事件到前端
3. `App.vue` 接收到 `language-changed` 事件：
   - 调用 `setLocale(newLocale)`
   - `i18n.global.locale.value` 更新
   - 所有使用 `$t()` / `useI18n()` 的组件自动重新渲染
4. 用户再次打开应用时：
   - Rust 后端从 `settings.json` 读取语言
   - `App.vue` `onMounted` 调用 `invoke('get_language')` 同步

## V1.8.1 联动审查要点

- 首次启动默认语言为 `zh-CN`，由 `src/i18n/index.ts` 的 `DEFAULT_LOCALE` 和 Rust `AppConfig::default()` 共同保证。
- 原生菜单是语言状态的主入口；菜单切换会重建 Rust 菜单并发送 `language-changed` 事件。
- Vue 前端通过同一个 `language-changed` 事件调用 `setLocale()`，不会重置当前文件路径、编辑模式或 `currentContent`。
- 工具栏、欢迎页、目录面板、源码编辑器 placeholder、富文本编辑器工具栏、导出对话框标题都应使用 i18n key。
- 系统原生文件对话框的按钮（如 Cancel / Save / Open）由操作系统决定，可能跟随系统语言而不是 md-quicklook 的应用语言。

## 硬编码文案审查

用户可见英文文案应只出现在：

- `src/i18n/locales/en-US.ts`
- 原生英文菜单构建函数 `build_menu_en()`
- 测试文档或说明文档

组件中允许保留的英文仅限代码注释、类型名、组件名、日志、文件格式名（如 Word / Excel / Markdown）以及示例排版标记（如 H1/H2）。

## 设计决策

### legacy: false（Composition API 模式）

使用 vue-i18n v10 的 Composition API 模式而非 Legacy 模式：
- 更好的 TypeScript 支持
- 与 Vue 3 `<script setup>` 风格一致
- `$t()` 在模板中自动可用，无需额外配置

### fallbackLocale: 'en-US'

当翻译键缺失时回退到英文，确保总能看到可读文案。

### 导出取消检测

"Export cancelled" 场景使用翻译后比较：
- Store 抛出 `i18n.global.t('export.exportCancelled')`
- 组件捕获后用 `t('export.exportCancelled')` 比较
- 两者使用同一个 i18n 实例，始终匹配

### 系统对话框标题

`@tauri-apps/plugin-dialog` 的 `save()` / `open()` 函数接受 `title` 参数，
但这些标题在某些平台上可能被系统覆盖。已为这些标题提供翻译键，
在支持自定义标题的平台上会显示对应语言。

## 添加新翻译

1. 在 `zh-CN.ts` 和 `en-US.ts` 的对应域中添加新的键值对
2. 在代码中使用对应的 `$t()` 或 `i18n.global.t()` 调用
3. 运行 `npm run build` 确认编译通过
