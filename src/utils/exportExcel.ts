import { i18n } from '../i18n'
import { normalizeMarkdownForRender, parseFrontMatter } from './markdown'
import {
  tableHeaderBg,
  tableHeaderTextColor,
  tableBorderColor,
  tableEvenRowBg,
  bodyFontZh,
  bodyColor,
  bodyFontSize,
} from './documentExportTheme'

export type MarkdownTable = {
  rows: string[][]
  heading?: string
}

// ── Sheet name helpers ─────────────────────────────────────────────

const MAX_SHEET_NAME = 31
const SHEET_NAME_ILLEGAL = /[\[\]:*?/\\]/g

function sanitizeSheetName(name: string): string {
  return name
    .replace(SHEET_NAME_ILLEGAL, '')
    .replace(/^\s+|\s+$/g, '')
    .slice(0, MAX_SHEET_NAME) || 'Sheet'
}

function uniqueSheetName(baseName: string, usedNames: Set<string>): string {
  const sanitizedBase = sanitizeSheetName(baseName)
  if (!usedNames.has(sanitizedBase)) return sanitizedBase

  let counter = 2
  while (true) {
    const suffix = `_${counter}`
    const candidate = `${sanitizedBase.slice(0, MAX_SHEET_NAME - suffix.length)}${suffix}`
    if (!usedNames.has(candidate)) return candidate
    counter++
  }
}

// ── Table row parsing ──────────────────────────────────────────────

function endsWithUnescapedPipe(value: string): boolean {
  let slashCount = 0
  for (let i = value.length - 2; i >= 0 && value[i] === '\\'; i--) {
    slashCount++
  }
  return value.endsWith('|') && slashCount % 2 === 0
}

function splitMarkdownTableRow(line: string): string[] {
  let value = line.trim()
  if (value.startsWith('|')) value = value.slice(1)
  if (endsWithUnescapedPipe(value)) value = value.slice(0, -1)

  const cells: string[] = []
  let cell = ''
  let escaped = false
  let inCode = false

  for (const char of value) {
    if (escaped) {
      cell += char
      escaped = false
    } else if (char === '\\') {
      escaped = true
    } else if (char === '`') {
      inCode = !inCode
      cell += char
    } else if (char === '|' && !inCode) {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }

  cells.push(cell.trim())
  return cells
}

function isTableRow(line: string): boolean {
  return line.includes('|') && splitMarkdownTableRow(line).length >= 2
}

function isSeparatorRow(line: string): boolean {
  const cells = splitMarkdownTableRow(line)
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
}

function normalizeRow(row: string[], columnCount: number): string[] {
  if (row.length === columnCount) return row
  if (row.length > columnCount) return row.slice(0, columnCount)
  return [...row, ...Array<string>(columnCount - row.length).fill('')]
}

function extractPrecedingHeading(lines: string[], tableStartIndex: number): string | undefined {
  for (let j = tableStartIndex - 1; j >= 0; j--) {
    const line = lines[j].trim()
    if (line === '') continue
    const match = line.match(/^#{1,6}\s+(.+)/)
    if (match) return match[1].trim()
    if (!line.startsWith('#')) break
  }
  return undefined
}

// ── Table extraction ───────────────────────────────────────────────

export function parseMarkdownTables(markdown: string): MarkdownTable[] {
  const lines = normalizeMarkdownForRender(markdown).replace(/\r\n?/g, '\n').split('\n')
  const tables: MarkdownTable[] = []

  for (let i = 0; i < lines.length - 1; i++) {
    if (!isTableRow(lines[i]) || !isSeparatorRow(lines[i + 1])) continue

    const heading = extractPrecedingHeading(lines, i)
    const header = splitMarkdownTableRow(lines[i])
    const columnCount = header.length
    const rows = [header]
    let cursor = i + 2

    while (cursor < lines.length && isTableRow(lines[cursor])) {
      rows.push(normalizeRow(splitMarkdownTableRow(lines[cursor]), columnCount))
      cursor++
    }

    tables.push({ rows, heading })
    i = cursor - 1
  }

  return tables
}

// ── Table-only detection ───────────────────────────────────────────

/**
 * Check whether the Markdown content is a "table-only" document.
 *
 * A table-only document may have:
 * 1. YAML Front Matter (optional)
 * 2. A single H1 heading after front matter (optional)
 * 3. The body must consist entirely of Markdown tables
 *
 * Documents with paragraphs, lists, code blocks, or other non-table
 * content mixed with tables are NOT table-only.
 */
export function isTableOnlyMarkdown(markdown: string): boolean {
  const lines = normalizeMarkdownForRender(markdown).replace(/\r\n?/g, '\n').split('\n')
  let i = 0
  let tableCount = 0

  // Skip leading blank lines
  while (i < lines.length && lines[i].trim() === '') i++
  if (i >= lines.length) return false

  // Skip optional single H1 heading
  if (/^#\s+.+/.test(lines[i].trim())) i++

  // Verify all remaining content is tables
  while (i < lines.length) {
    const line = lines[i].trim()

    // Skip blank lines (separators between tables)
    if (line === '') {
      i++
      continue
    }

    // Must start a table: header row + separator row
    if (!isTableRow(line)) return false
    if (i + 1 >= lines.length || !isSeparatorRow(lines[i + 1].trim())) return false

    tableCount++
    i += 2 // skip header + separator

    // Consume data rows
    while (i < lines.length) {
      const dataLine = lines[i].trim()
      if (dataLine === '') break // End of this table (blank line before next table)

      if (!isTableRow(dataLine)) {
        // Could be start of next table (header + separator)
        if (i + 1 < lines.length && isSeparatorRow(lines[i + 1].trim())) {
          break // New table starts here
        }
        return false // Non-table content found
      }
      i++
    }
  }

  return tableCount > 0
}

// ── Sheet name resolution ──────────────────────────────────────────

/**
 * Resolve sheet name from front matter title → H1 → filename → fallback.
 */
// ── Number detection ───────────────────────────────────────────────

function isNumericValue(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed === '') return false
  return /^-?\d+(\.\d+)?%?$/.test(trimmed)
}

function toNumericValue(value: string): number | string {
  const trimmed = value.trim()
  if (trimmed.endsWith('%')) {
    const num = parseFloat(trimmed.slice(0, -1))
    return isNaN(num) ? value : num / 100
  }
  const num = parseFloat(trimmed)
  return isNaN(num) ? value : num
}

function convertNumericCells(rows: string[][]): (string | number)[][] {
  return rows.map((row, rowIndex) => {
    if (rowIndex === 0) return row.slice()
    return row.map((cell) => (isNumericValue(cell) ? toNumericValue(cell) : cell))
  })
}

// ── Theme style builders (xlsx-js-style) ────────────────────────────

interface CellStyle {
  font: { name: string; sz: number; bold?: boolean; color?: { rgb: string } }
  fill?: { fgColor: { rgb: string }; patternType: 'solid' }
  border: {
    top: { style: 'thin'; color: { rgb: string } }
    bottom: { style: 'thin'; color: { rgb: string } }
    left: { style: 'thin'; color: { rgb: string } }
    right: { style: 'thin'; color: { rgb: string } }
  }
  alignment: { vertical: 'center' }
}

function hex6(c: string): string {
  return c.replace('#', '').toUpperCase()
}

function makeHeaderStyle(): CellStyle {
  return {
    font: {
      name: bodyFontZh,
      sz: bodyFontSize,
      bold: true,
      color: { rgb: hex6(tableHeaderTextColor) },
    },
    fill: { fgColor: { rgb: hex6(tableHeaderBg) }, patternType: 'solid' },
    border: {
      top: { style: 'thin', color: { rgb: hex6(tableBorderColor) } },
      bottom: { style: 'thin', color: { rgb: hex6(tableBorderColor) } },
      left: { style: 'thin', color: { rgb: hex6(tableBorderColor) } },
      right: { style: 'thin', color: { rgb: hex6(tableBorderColor) } },
    },
    alignment: { vertical: 'center' },
  }
}

function makeBodyStyle(even: boolean): CellStyle {
  return {
    font: { name: bodyFontZh, sz: bodyFontSize, color: { rgb: hex6(bodyColor) } },
    fill: even
      ? { fgColor: { rgb: hex6(tableEvenRowBg) }, patternType: 'solid' }
      : undefined,
    border: {
      top: { style: 'thin', color: { rgb: hex6(tableBorderColor) } },
      bottom: { style: 'thin', color: { rgb: hex6(tableBorderColor) } },
      left: { style: 'thin', color: { rgb: hex6(tableBorderColor) } },
      right: { style: 'thin', color: { rgb: hex6(tableBorderColor) } },
    },
    alignment: { vertical: 'center' },
  }
}

// ── Sheet name extraction ──────────────────────────────────────────

/**
 * Extract the best sheet name from Markdown content.
 * Priority: Front Matter title → first H1 → fileName → "Sheet1"
 */
function extractSheetName(markdown: string, fallbackFile: string): string {
  // Try front matter title
  const { metadata } = parseFrontMatter(markdown)
  if (metadata.title) {
    const sanitized = sanitizeSheetName(metadata.title)
    if (sanitized.length > 0) return sanitized
  }

  // Try first H1
  const body = normalizeMarkdownForRender(markdown)
  const h1Match = body.match(/^#\s+(.+)/m)
  if (h1Match) {
    const sanitized = sanitizeSheetName(h1Match[1].trim())
    if (sanitized.length > 0) return sanitized
  }

  // Fall back to file name (without extension)
  const base = fallbackFile.replace(/\.[^.]+$/, '') || 'Sheet1'
  const sanitized = sanitizeSheetName(base)
  return sanitized || 'Sheet1'
}

// ── Main export function ────────────────────────────────────────────

export async function generateXlsxBytes(markdown: string, fileName?: string): Promise<Uint8Array> {
  // Check table-only boundary
  if (!isTableOnlyMarkdown(markdown)) {
    throw new Error(i18n.global.t('export.notTableOnly'))
  }

  const tables = parseMarkdownTables(markdown)
  if (tables.length === 0) {
    throw new Error(i18n.global.t('export.noTables'))
  }

  const XLSX = await import('xlsx-js-style')
  const workbook = XLSX.utils.book_new()
  const usedNames = new Set<string>()
  const defaultSheetName = extractSheetName(markdown, fileName || 'export')
  const headerStyle = makeHeaderStyle()
  const bodyStyle = makeBodyStyle(false)
  const evenStyle = makeBodyStyle(true)

  for (const [index, table] of tables.entries()) {
    const processedRows = convertNumericCells(table.rows)

    // Build styled cells with xlsx-js-style
    const styledRows = processedRows.map((row, rowIndex) =>
      row.map((cell) => ({
        v: cell,
        t: typeof cell === 'number' ? 'n' : 's',
        s: rowIndex === 0 ? headerStyle : (rowIndex % 2 === 0 ? evenStyle : bodyStyle),
      })),
    )

    const sheet = XLSX.utils.aoa_to_sheet(styledRows)

    // Auto-filter
    const columnCount = processedRows[0]?.length ?? 0
    if (processedRows.length > 0 && columnCount > 0) {
      sheet['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: processedRows.length - 1, c: columnCount - 1 },
        }),
      }
    }

    // Freeze header row
    if (processedRows.length > 1) {
      ;(sheet as Record<string, unknown>)['!freeze'] = { xsplit: 0, ysplit: 1 }
    }

    // Auto-fit column widths
    sheet['!cols'] = Array.from({ length: columnCount }, (_, columnIndex) => {
      const maxLength = Math.max(
        ...processedRows.map((row) => String(row[columnIndex] ?? '').length),
      )
      return { wch: Math.min(Math.max(maxLength + 2, 10), 40) }
    })

    // Build unique sheet name
    const baseName = index === 0
      ? defaultSheetName
      : sanitizeSheetName(table.heading || `Table ${index + 1}`)
    const name = uniqueSheetName(baseName, usedNames)
    usedNames.add(name)

    XLSX.utils.book_append_sheet(workbook, sheet, name)
  }

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Uint8Array(output)
}
