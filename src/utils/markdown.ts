import MarkdownIt from 'markdown-it'
import type { BuiltinLanguage } from 'shiki'

type CreateHighlighter = typeof import('shiki')['createHighlighter']
type Highlighter = Awaited<ReturnType<CreateHighlighter>>
export type MarkdownMetadata = {
  title?: string
  subtitle?: string
  date?: string
  author?: string
  tags?: string[]
}

export type ParsedFrontMatter = {
  metadata: MarkdownMetadata
  raw: string
  body: string
  hasFrontMatter: boolean
  bodyStartLine: number
}

let _highlighter: Highlighter | null = null

async function getHighlighter() {
  if (!_highlighter) {
    const { createHighlighter } = await import('shiki')
    _highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [] as BuiltinLanguage[],
    })
  }
  return _highlighter
}

// Cache for loaded languages
const loadedLangs = new Set<string>()

const supportedFrontMatterFields = new Set(['title', 'subtitle', 'date', 'author', 'tags'])

async function ensureLang(lang: string) {
  const hl = await getHighlighter()
  if (!loadedLangs.has(lang)) {
    try {
      // @ts-ignore dynamic import of shiki grammar
      await hl.loadLanguage(lang as BuiltinLanguage)
      loadedLangs.add(lang)
    } catch {
      // Fallback: load as plain text
      console.warn(`Language "${lang}" not available, using plain text`)
    }
  }
  return hl
}

const allowedTags = new Set([
  'a', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'hr', 'img', 'li', 'ol', 'p', 'pre', 'span', 'strong',
  'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul',
])

const globalAttributes = new Set(['class', 'data-lang', 'id', 'title'])
const attributesByTag: Record<string, Set<string>> = {
  a: new Set(['href', 'rel', 'target', 'title']),
  img: new Set(['alt', 'height', 'src', 'title', 'width']),
  pre: new Set(['class', 'data-lang', 'style', 'tabindex']),
  span: new Set(['class', 'style']),
}

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, '')
  if (/^(javascript|vbscript|data|file):/i.test(trimmed)) return false

  try {
    const parsed = new URL(trimmed, 'https://md-quicklook.local/')
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function sanitizeStyle(value: string): string {
  const allowedProperties = new Set(['background-color', 'color'])
  return value
    .split(';')
    .map((rule) => rule.trim())
    .filter((rule) => {
      const separator = rule.indexOf(':')
      if (separator <= 0) return false

      const property = rule.slice(0, separator).trim().toLowerCase()
      const propertyValue = rule.slice(separator + 1).trim()
      return allowedProperties.has(property)
        && /^#[0-9a-f]{3,8}$/i.test(propertyValue)
    })
    .join('; ')
}

function sanitizeHtml(html: string): string {
  const template = document.createElement('template')
  template.innerHTML = html

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT)
  const elements: Element[] = []

  while (walker.nextNode()) {
    elements.push(walker.currentNode as Element)
  }

  for (const element of elements) {
    const tagName = element.tagName.toLowerCase()
    if (!allowedTags.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      continue
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()
      const tagAttributes = attributesByTag[tagName]
      const isAllowed = globalAttributes.has(name) || tagAttributes?.has(name)

      if (!isAllowed || name.startsWith('on')) {
        element.removeAttribute(attribute.name)
        continue
      }

      if ((name === 'href' || name === 'src') && !isSafeUrl(attribute.value)) {
        element.removeAttribute(attribute.name)
      }

      if (name === 'style') {
        const style = sanitizeStyle(attribute.value)
        if (style) element.setAttribute('style', style)
        else element.removeAttribute('style')
      }
    }

    if (tagName === 'a' && element.hasAttribute('href')) {
      element.setAttribute('rel', 'noreferrer noopener')
      element.setAttribute('target', '_blank')
    }
  }

  return template.innerHTML
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: false,
  highlight(str: string, lang: string): string {
    // Return a placeholder; we'll do async highlighting in the component
    const escaped = md.utils.escapeHtml(str)
    const escapedLang = md.utils.escapeHtml(lang)
    return `<pre class="shiki-pending" data-lang="${escapedLang}"><code>${escaped}</code></pre>`
  },
})

md.validateLink = isSafeUrl

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, '\n')
}

function parseTagsValue(value: string): string[] {
  const trimmed = value.trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
  }
  return trimmed
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function setMetadataValue(metadata: MarkdownMetadata, key: string, value: string) {
  if (!supportedFrontMatterFields.has(key)) return
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '')
  if (key === 'tags') {
    const tags = parseTagsValue(value)
    if (tags.length > 0) metadata.tags = tags
  } else if (trimmed) {
    metadata[key as keyof Omit<MarkdownMetadata, 'tags'>] = trimmed
  }
}

export function parseFrontMatter(content: string): ParsedFrontMatter {
  const normalized = normalizeLineEndings(content)
  const lines = normalized.split('\n')

  if (lines[0]?.trim() !== '---') {
    return {
      metadata: {},
      raw: '',
      body: normalized,
      hasFrontMatter: false,
      bodyStartLine: 0,
    }
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() !== '---') continue

    const metadata: MarkdownMetadata = {}
    let currentListKey: string | null = null
    let isValidFrontMatter = true

    for (let j = 1; j < i; j++) {
      const line = lines[j]
      if (line.trim() === '') continue

      const listItem = line.match(/^\s*-\s+(.+?)\s*$/)
      if (listItem && currentListKey === 'tags') {
        if (!Array.isArray(metadata.tags)) metadata.tags = []
        metadata.tags.push(listItem[1].trim().replace(/^['"]|['"]$/g, ''))
        continue
      }

      const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/)
      if (!field) {
        isValidFrontMatter = false
        break
      }

      const key = field[1].trim()
      const value = field[2] ?? ''
      currentListKey = value.trim() === '' ? key : null

      if (key === 'tags' && value.trim() === '') {
        metadata.tags = []
      } else {
        setMetadataValue(metadata, key, value)
      }
    }

    if (!isValidFrontMatter) {
      return {
        metadata: {},
        raw: '',
        body: normalized,
        hasFrontMatter: false,
        bodyStartLine: 0,
      }
    }

    if (metadata.tags?.length === 0) delete metadata.tags

    return {
      metadata,
      raw: lines.slice(0, i + 1).join('\n'),
      body: lines.slice(i + 1).join('\n'),
      hasFrontMatter: true,
      bodyStartLine: i + 1,
    }
  }

  return {
    metadata: {},
    raw: '',
    body: normalized,
    hasFrontMatter: false,
    bodyStartLine: 0,
  }
}

export function stripFrontMatterForRender(content: string): string {
  return parseFrontMatter(content).body
}

export function getMarkdownMetadata(content: string): MarkdownMetadata {
  return parseFrontMatter(content).metadata
}

function formatFrontMatterValue(value?: string): string {
  return value?.trim() ?? ''
}

export function serializeFrontMatter(metadata: MarkdownMetadata = {}): string {
  const lines = [
    '---',
    `title: ${formatFrontMatterValue(metadata.title)}`,
    `subtitle: ${formatFrontMatterValue(metadata.subtitle)}`,
    `author: ${formatFrontMatterValue(metadata.author)}`,
    `date: ${formatFrontMatterValue(metadata.date)}`,
    'tags:',
  ]

  for (const tag of metadata.tags ?? []) {
    const trimmed = tag.trim()
    if (trimmed) lines.push(`  - ${trimmed}`)
  }

  lines.push('---')
  return lines.join('\n')
}

export function insertFrontMatterTemplate(content: string): string {
  const parsed = parseFrontMatter(content)
  if (parsed.hasFrontMatter) return normalizeLineEndings(content)
  return `${serializeFrontMatter()}\n\n${normalizeLineEndings(content)}`
}

export function upsertFrontMatter(content: string, metadata: MarkdownMetadata): string {
  const parsed = parseFrontMatter(content)
  const body = parsed.hasFrontMatter ? parsed.body.replace(/^\n/, '') : normalizeLineEndings(content)
  return `${serializeFrontMatter(metadata)}\n\n${body}`
}

export function removeFrontMatter(content: string): string {
  const parsed = parseFrontMatter(content)
  if (!parsed.hasFrontMatter) return normalizeLineEndings(content)
  return parsed.body.replace(/^\n/, '')
}

export function generateTitleFromFrontMatter(content: string): string {
  const parsed = parseFrontMatter(content)
  const title = parsed.metadata.title?.trim()
  if (!parsed.hasFrontMatter || !title) return normalizeLineEndings(content)

  const body = parsed.body.replace(/^\n/, '')
  const firstMeaningfulLine = body.split('\n').find((line) => line.trim() !== '')
  if (firstMeaningfulLine && /^#\s+\S/.test(firstMeaningfulLine.trim())) {
    return normalizeLineEndings(content)
  }

  return `${parsed.raw}\n\n# ${title}\n\n${body}`
}

export function isEmptyMarkdownHeadingLine(line: string): boolean {
  return /^#{1,6}\s*$/.test(line.trim())
}

export function removeEmptyMarkdownHeadings(content: string): string {
  return normalizeLineEndings(content)
    .split('\n')
    .filter((line) => !isEmptyMarkdownHeadingLine(line))
    .join('\n')
}

/**
 * Strip loose metadata lines from the top of the content.
 *
 * Loose metadata are `key: value` lines at the very start of a Markdown
 * file WITHOUT `---` Front Matter delimiters.  Many AI models generate
 * this style, and the values are often empty (e.g. `title:` alone).
 *
 * Only the **known** Front Matter keys are recognised as metadata:
 * `title`, `subtitle`, `author`, `date`, `tags`.
 *
 * Lines like `项目: 深圳故事` in the body are left alone because:
 * 1. They don't use a known key.
 * 2. Even if they did, stripping stops at the first non-metadata line.
 */
function stripLooseMetadata(content: string): string {
  const LINES = normalizeLineEndings(content).split('\n')
  let i = 0

  // Skip leading blank lines
  while (i < LINES.length && LINES[i].trim() === '') i++

  // Consume consecutive known-metadata-key lines (value may be empty).
  // Stopping condition: line does NOT match `KnownKey: optional-value`.
  while (i < LINES.length) {
    const m = LINES[i].match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/)
    if (!m) break
    const key = m[1].trim()
    if (!supportedFrontMatterFields.has(key)) break
    i++
  }

  // Skip blank lines between metadata block and real content
  while (i < LINES.length && LINES[i].trim() === '') i++

  return LINES.slice(i).join('\n')
}

/**
 * Extract the meaningful Markdown body for rendering / outline / export.
 *
 * Processing order:
 * 1. Strip YAML Front Matter (`---` … `---`)
 * 2. If no FM found, strip loose metadata (`Key: value` at the top)
 * 3. Remove empty heading lines (`# `, `## `, …)
 *
 * This is the **single entry point** every consumer should use.
 */
export function getMarkdownBody(content: string): string {
  const parsed = parseFrontMatter(content)
  const body = parsed.hasFrontMatter ? parsed.body : stripLooseMetadata(content)
  return removeEmptyMarkdownHeadings(body)
}

export function normalizeMarkdownForRender(content: string): string {
  return getMarkdownBody(content)
}

export function getMarkdownHeadings(content: string): { level: number; text: string; line: number }[] {
  const body = getMarkdownBody(content)
  const lines = body.split('\n')
  const result: { level: number; text: string; line: number }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip empty lines (empty headings already removed by getMarkdownBody)
    if (line.trim() === '') continue

    const match = line.match(/^(#{1,6})\s+(.+)$/)
    const text = match?.[2]?.trim()
    if (!match || !text) continue

    result.push({
      level: match[1].length,
      text,
      line: i,
    })
  }

  return result
}

/**
 * Render markdown to HTML (synchronous, code blocks will be highlighted async)
 */
export function renderMarkdown(content: string): string {
  return sanitizeHtml(md.render(normalizeMarkdownForRender(content)))
}

/**
 * Highlight all pending code blocks in a container element
 */
export async function highlightCodeBlocks(container: HTMLElement) {
  const blocks = container.querySelectorAll<HTMLElement>('.shiki-pending')
  for (const block of blocks) {
    const lang = block.dataset.lang || 'text'
    const code = block.querySelector('code')
    if (!code) continue
    try {
      const hl = await ensureLang(lang)
      const html = hl.codeToHtml(code.textContent || '', {
        lang,
        theme: 'github-dark',
      })
      block.outerHTML = sanitizeHtml(html)
    } catch {
      // Keep the plain text if highlighting fails
    }
  }
}
