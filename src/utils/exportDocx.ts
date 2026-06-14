import MarkdownIt from 'markdown-it'
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import type { IParagraphOptions } from 'docx'
import type { IFontAttributesProperties } from 'docx'
import { normalizeMarkdownForRender } from './markdown'
import {
  bodyFontEn,
  bodyFontZh,
  headingFontEn,
  headingFontZh,
  codeFontOffice,
  headingColor,
  h4Color,
  bodyColor,
  inlineCodeBg,
  inlineCodeColor,
  codeBlockBg,
  codeBlockTextColor,
  codeBlockFontSize,
  blockquoteBg,
  blockquoteBorderColor,
  blockquoteTextColor,
  hrColor,
  tableHeaderBg,
  tableHeaderTextColor,
  tableBorderColor,
  tableEvenRowBg,
  bodyFontSize,
  h1Size,
  h2Size,
  h3Size,
  h4Size,
} from './documentExportTheme'

type MarkdownToken = ReturnType<MarkdownIt['parse']>[number]
type InlineChild = NonNullable<MarkdownToken['children']>[number]
type InlineRun = TextRun | ExternalHyperlink
type DocxChild = Paragraph | Table

// ── Fonts (from theme) ────────────────────────────────────────────

const BODY_FONT: IFontAttributesProperties = {
  ascii: bodyFontEn,
  hAnsi: bodyFontEn,
  eastAsia: bodyFontZh,
}

const HEADING_FONT: IFontAttributesProperties = {
  ascii: headingFontEn,
  hAnsi: headingFontEn,
  eastAsia: headingFontZh,
}

const CODE_FONT: IFontAttributesProperties = {
  ascii: codeFontOffice,
  hAnsi: codeFontOffice,
  eastAsia: codeFontOffice,
}

// ── Run-level overrides (size + color) ────────────────────────────

interface RunOverrides {
  bold?: boolean
  italics?: boolean
  size?: number // half-points
  color?: string
}

// ── Heading config ────────────────────────────────────────────────

/** Font sizes in half-points: px * 2 */
const px = (v: number) => v * 2

const headingSizes: Record<string, number> = {
  h1: px(h1Size),
  h2: px(h2Size),
  h3: px(h3Size),
  h4: px(h4Size),
}

const headingColors: Record<string, string> = {
  h1: headingColor,
  h2: headingColor,
  h3: headingColor,
  h4: h4Color,
}

// ── Markdown parser ───────────────────────────────────────────────

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
})

const headingLevels: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
}

// ── Helpers ───────────────────────────────────────────────────────

function safeText(text: string): string {
  return text.replace(/\u0000/g, '')
}

function imageAltFromSrc(src: string): string {
  const parts = src.split('/')
  return parts[parts.length - 1] || 'image'
}

function createRunsFromInline(
  token?: MarkdownToken,
  overrides: RunOverrides = {},
  font?: string | IFontAttributesProperties,
): InlineRun[] {
  const runs: InlineRun[] = []
  const defaultFont = font ?? BODY_FONT
  let bold = overrides.bold ?? false
  let italics = overrides.italics ?? false
  let strike = false
  let activeLink: string | null = null
  let linkRuns: TextRun[] = []

  function pushRun(run: TextRun) {
    if (activeLink) {
      linkRuns.push(run)
    } else {
      runs.push(run)
    }
  }

  function flushLink() {
    if (!activeLink) return
    if (linkRuns.length > 0) {
      runs.push(new ExternalHyperlink({ link: activeLink, children: linkRuns }))
    }
    activeLink = null
    linkRuns = []
  }

  for (const child of token?.children ?? []) {
    switch (child.type) {
      case 'text':
        if (child.content) {
          pushRun(new TextRun({
            text: safeText(child.content),
            bold,
            italics,
            strike,
            size: overrides.size,
            color: overrides.color,
            font: defaultFont,
          }))
        }
        break
      case 'code_inline':
        pushRun(new TextRun({
          text: safeText(child.content),
          bold,
          italics,
          strike,
          size: overrides.size,
          color: inlineCodeColor,
          font: CODE_FONT,
          shading: { type: ShadingType.CLEAR, fill: inlineCodeBg.replace('#', '') },
        }))
        break
      case 'strong_open':
        bold = true
        break
      case 'strong_close':
        bold = overrides.bold ?? false
        break
      case 'em_open':
        italics = true
        break
      case 'em_close':
        italics = overrides.italics ?? false
        break
      case 's_open':
        strike = true
        break
      case 's_close':
        strike = false
        break
      case 'link_open':
        activeLink = linkHref(child)
        linkRuns = []
        break
      case 'link_close':
        flushLink()
        break
      case 'softbreak':
      case 'hardbreak':
        pushRun(new TextRun({ break: 1 }))
        break
      case 'image': {
        const src = child.attrGet('src') ?? ''
        const alt = child.content || imageAltFromSrc(src)
        pushRun(new TextRun({
          text: `[Image: ${alt}]`,
          italics: true,
          color: '6B7280',
          font: defaultFont,
        }))
        break
      }
      default:
        break
    }
  }

  flushLink()
  return runs.length > 0 ? runs : [new TextRun({ font: defaultFont, size: overrides.size, color: overrides.color })]
}

function linkHref(token: InlineChild): string | null {
  const href = token.attrGet('href')
  if (!href) return null

  try {
    const parsed = new URL(href)
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return href
    }
  } catch {
    return null
  }

  return null
}

function paragraphFromInline(
  inlineToken: MarkdownToken | undefined,
  options: Omit<IParagraphOptions, 'children' | 'text'> = {},
  runOptions: RunOverrides = {},
  font?: string | IFontAttributesProperties,
): Paragraph {
  return new Paragraph({
    spacing: { after: 160 },
    ...options,
    children: createRunsFromInline(inlineToken, runOptions, font),
  })
}

function codeBlock(content: string): Paragraph[] {
  const lines = safeText(content).replace(/\n$/, '').split('\n')
  const bg = codeBlockBg.replace('#', '')
  return lines.map((line) => new Paragraph({
    spacing: { before: 40, after: 40 },
    shading: { type: ShadingType.CLEAR, fill: bg },
    children: [
      new TextRun({
        text: line || ' ',
        font: CODE_FONT,
        size: px(codeBlockFontSize),
        color: codeBlockTextColor,
      }),
    ],
  }))
}

function horizontalRule(): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 180 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: hrColor.replace('#', ''), space: 1 },
    },
  })
}

function tableFromTokens(tokens: MarkdownToken[], startIndex: number): { table: Table; nextIndex: number } {
  const rows: MarkdownToken[][][] = []
  let currentRow: MarkdownToken[][] | null = null

  let i = startIndex + 1
  for (; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === 'table_close') break

    if (token.type === 'tr_open') {
      currentRow = []
    } else if (token.type === 'tr_close') {
      if (currentRow) rows.push(currentRow)
      currentRow = null
    } else if ((token.type === 'th_open' || token.type === 'td_open') && currentRow) {
      const inline = tokens[i + 1]
      currentRow.push(inline?.type === 'inline' ? [inline] : [])
    }
  }

  const columnCount = Math.max(...rows.map((row) => row.length), 1)
  const cellWidth = Math.floor(9000 / columnCount)
  const headerBg = tableHeaderBg.replace('#', '')
  const evenBg = tableEvenRowBg.replace('#', '')
  const borderColor = tableBorderColor.replace('#', '')

  const tableRows = rows.map((row, rowIndex) => new TableRow({
    children: Array.from({ length: columnCount }, (_, columnIndex) => {
      const inline = row[columnIndex]?.[0]
      const isHeader = rowIndex === 0
      const isEven = rowIndex > 0 && rowIndex % 2 === 0
      return new TableCell({
        width: { size: cellWidth, type: WidthType.DXA },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
          left: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
          right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
        },
        shading: isHeader
          ? { type: ShadingType.CLEAR, fill: headerBg }
          : isEven
            ? { type: ShadingType.CLEAR, fill: evenBg.replace('#', '') }
            : undefined,
        children: [
          new Paragraph({
            spacing: { after: 0 },
            children: createRunsFromInline(
              inline,
              { bold: isHeader, color: isHeader ? tableHeaderTextColor : bodyColor },
            ),
          }),
        ],
      })
    }),
  }))

  return {
    table: new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    }),
    nextIndex: i,
  }
}

function collectListItemInline(tokens: MarkdownToken[], startIndex: number): { inline?: MarkdownToken; nextIndex: number } {
  let i = startIndex + 1
  for (; i < tokens.length; i++) {
    if (tokens[i].type === 'inline') {
      return { inline: tokens[i], nextIndex: i }
    }
    if (tokens[i].type === 'list_item_close') break
  }
  return { nextIndex: i }
}

function createDocumentChildren(markdown: string): DocxChild[] {
  const tokens = md.parse(normalizeMarkdownForRender(markdown), {})
  const children: DocxChild[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type === 'heading_open') {
      const inline = tokens[i + 1]
      const heading = headingLevels[token.tag]
      const tag = token.tag
      if (heading) {
        // H1-H4: explicit heading style + theme size/color
        children.push(paragraphFromInline(inline, {
          heading,
          spacing: { before: 160, after: 120 },
        }, {
          bold: true,
          size: headingSizes[tag],
          color: headingColors[tag],
        }, HEADING_FONT))
      } else if (tag === 'h5' || tag === 'h6') {
        // H5-H6: muted small headings, no Word heading style
        children.push(paragraphFromInline(inline, {
          spacing: { before: 120, after: 80 },
        }, {
          bold: true,
          size: px(bodyFontSize),
          color: '6F716F',
        }, HEADING_FONT))
      }
      i += 2
    } else if (token.type === 'paragraph_open') {
      children.push(paragraphFromInline(tokens[i + 1], {}, { color: bodyColor }))
      i += 2
    } else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const reference = token.type === 'bullet_list_open' ? 'markdown-bullets' : 'markdown-numbers'
      while (i < tokens.length && tokens[i].type !== (token.type === 'bullet_list_open' ? 'bullet_list_close' : 'ordered_list_close')) {
        if (tokens[i].type === 'list_item_open') {
          const { inline, nextIndex } = collectListItemInline(tokens, i)
          children.push(paragraphFromInline(inline, {
            numbering: { reference, level: 0 },
            spacing: { after: 80 },
          }, { color: bodyColor }))
          i = nextIndex
        }
        i++
      }
    } else if (token.type === 'blockquote_open') {
      const bqBg = blockquoteBg.replace('#', '')
      const bqBorder = blockquoteBorderColor.replace('#', '')
      while (i < tokens.length && tokens[i].type !== 'blockquote_close') {
        if (tokens[i].type === 'paragraph_open') {
          children.push(paragraphFromInline(tokens[i + 1], {
            indent: { left: 480 },
            border: { left: { style: BorderStyle.SINGLE, size: 18, color: bqBorder, space: 8 } },
            shading: { type: ShadingType.CLEAR, fill: bqBg },
          }, { color: blockquoteTextColor }))
          i += 2
        }
        i++
      }
    } else if (token.type === 'fence' || token.type === 'code_block') {
      children.push(...codeBlock(token.content))
    } else if (token.type === 'table_open') {
      const { table, nextIndex } = tableFromTokens(tokens, i)
      children.push(table)
      children.push(new Paragraph({ text: '', spacing: { after: 120 } }))
      i = nextIndex
    } else if (token.type === 'hr') {
      children.push(horizontalRule())
    }
  }

  return children.length > 0 ? children : [new Paragraph('')]
}

function documentBytes(doc: Document) {
  return Packer.toBlob(doc).then((blob) =>
    blob.arrayBuffer().then((buf) => new Uint8Array(buf)),
  )
}

export function generateDocxBytes(markdown: string): Promise<Uint8Array> {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'markdown-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '\u2022',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: 'markdown-numbers',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: createDocumentChildren(markdown),
      },
    ],
  })

  return documentBytes(doc)
}
