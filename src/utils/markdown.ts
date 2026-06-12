import MarkdownIt from 'markdown-it'
import { createHighlighter, type BuiltinLanguage } from 'shiki'

let _highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null

async function getHighlighter() {
  if (!_highlighter) {
    _highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: [] as BuiltinLanguage[],
    })
  }
  return _highlighter
}

// Cache for loaded languages
const loadedLangs = new Set<string>()

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

/**
 * Render markdown to HTML (synchronous, code blocks will be highlighted async)
 */
export function renderMarkdown(content: string): string {
  return sanitizeHtml(md.render(content))
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
