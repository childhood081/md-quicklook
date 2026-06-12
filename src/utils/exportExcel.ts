import type * as XLSXType from 'xlsx'
import { i18n } from '../i18n'

type XlsxModule = typeof import('xlsx')

export type MarkdownTable = {
  rows: string[][]
  heading?: string
}

// Sheet name helpers
const MAX_SHEET_NAME = 31
const SHEET_NAME_ILLEGAL = /[\[\]:*?/\\]/g

function sanitizeSheetName(name: string): string {
  return name
    .replace(SHEET_NAME_ILLEGAL, '')
    .replace(/^\s+|\s+$/g, '')
    .slice(0, MAX_SHEET_NAME) || 'Sheet'
}

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
    // If we hit a non-heading, non-empty line, stop looking
    if (!line.startsWith('#')) break
  }
  return undefined
}

export function parseMarkdownTables(markdown: string): MarkdownTable[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
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

function sheetName(index: number, heading?: string): string {
  if (heading) {
    const sanitized = sanitizeSheetName(heading)
    if (sanitized.length > 0) return sanitized
  }
  return `Table ${index + 1}`
}

function isNumericValue(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed === '') return false
  // Match integers, decimals, negative numbers, percentages
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

/** Convert numeric-looking strings in data rows (skip header) to numbers for proper Excel formatting. */
function convertNumericCells(rows: string[][]): (string | number)[][] {
  return rows.map((row, rowIndex) => {
    if (rowIndex === 0) return row.slice() // header stays as-is
    return row.map((cell) => (isNumericValue(cell) ? toNumericValue(cell) : cell))
  })
}

function applyWorksheetMetadata(
  sheet: XLSXType.WorkSheet,
  processedRows: (string | number)[][],
  xlsx: XlsxModule,
) {
  const columnCount = processedRows[0]?.length ?? 0
  if (processedRows.length > 0 && columnCount > 0) {
    sheet['!autofilter'] = {
      ref: xlsx.utils.encode_range({
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
}

export async function generateXlsxBytes(markdown: string): Promise<Uint8Array> {
  const tables = parseMarkdownTables(markdown)
  if (tables.length === 0) {
    throw new Error(i18n.global.t('export.noTables'))
  }

  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const usedNames = new Set<string>()

  for (const [index, table] of tables.entries()) {
    const processedRows = convertNumericCells(table.rows)
    const sheet = XLSX.utils.aoa_to_sheet(processedRows)
    applyWorksheetMetadata(sheet, processedRows, XLSX)

    // Build unique sheet name
    let name = sanitizeSheetName(sheetName(index, table.heading))
    if (usedNames.has(name)) {
      let counter = 2
      while (usedNames.has(`${name}_${counter}`)) counter++
      name = `${name}_${counter}`
    }
    usedNames.add(name)

    XLSX.utils.book_append_sheet(workbook, sheet, name)
  }

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Uint8Array(output)
}
