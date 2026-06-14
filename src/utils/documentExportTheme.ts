/**
 * Document Export Theme
 *
 * Single source of truth for export visual styling.
 * All values are extracted from the reading mode design
 * (src/styles/reader.css + src/style.css).
 *
 * Used by: Word export (exportDocx.ts), Excel export (exportExcel.ts),
 *          PDF export (exportPdf.ts), print.css.
 */

// ── Page / surface ──────────────────────────────────────────────────

/** App background behind the paper (--paper). */
export const pageBackground = '#f4f4f2'

/** Paper / container background (--surface-raised). */
export const paperBackground = '#ffffff'

// ── Typography ──────────────────────────────────────────────────────

/** Body font stack (web — used for PDF). */
export const bodyFont =
  '"Avenir Next", "Helvetica Neue", "Noto Sans SC", sans-serif'

/** Body font for Office exports — Latin (ascii / hAnsi). */
export const bodyFontEn = 'Times New Roman'

/** Body font for Office exports — East Asian (eastAsia). */
export const bodyFontZh = 'SimSun'

/** Heading font for Office exports — Latin. */
export const headingFontEn = 'Arial'

/** Heading font for Office exports — East Asian. */
export const headingFontZh = 'Microsoft YaHei'

/** Code font stack (web — monospace). */
export const codeFont =
  '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace'

/** Code font for Office exports. */
export const codeFontOffice = 'Consolas'

// ── Font sizes (px) ─────────────────────────────────────────────────

export const bodyFontSize = 16
export const h1Size = 44 // mid-range of clamp(36px, 5vw, 56px)
export const h2Size = 28
export const h3Size = 20
export const h4Size = 16

/** Code block font size (pre code). */
export const codeBlockFontSize = 14

// ── Line heights ────────────────────────────────────────────────────

export const bodyLineHeight = 1.72
export const codeBlockLineHeight = 1.6

// ── Colors ──────────────────────────────────────────────────────────

/** Body text color (.reader-content). */
export const bodyColor = '#222321'

/** Heading color (--ink). */
export const headingColor = '#111214'

/** H4 color (--charcoal). */
export const h4Color = '#2f3b42'

/** Link color (--indigo). */
export const linkColor = '#353183'

/** Inline code background. */
export const inlineCodeBg = '#f1f1ef'

/** Inline code text color (--danger). */
export const inlineCodeColor = '#b9242a'

/** Code block background (--charcoal). */
export const codeBlockBg = '#2f3b42'

/** Code block text color (Shiki github-dark primary). */
export const codeBlockTextColor = '#e1e4e8'

/** Blockquote background. */
export const blockquoteBg = '#f4f3f0'

/** Blockquote left border color (--indigo). */
export const blockquoteBorderColor = '#353183'

/** Blockquote left border width (px). */
export const blockquoteBorderWidth = 3

/** Blockquote text color (--charcoal). */
export const blockquoteTextColor = '#2f3b42'

/** Horizontal rule color (--line-strong). */
export const hrColor = '#1d1d1b'

// ── Table ───────────────────────────────────────────────────────────

/** Table header row background. */
export const tableHeaderBg = '#f0f0ed'

/** Table header text color (--ink). */
export const tableHeaderTextColor = '#111214'

/** Table cell border color (--line). */
export const tableBorderColor = '#d8d8d4'

/** Table top / bottom strong border color (--line-strong). */
export const tableStrongBorderColor = '#1d1d1b'

/** Table cell horizontal padding (px). */
export const tableCellPadding = 12

/** Even row background for zebra striping. */
export const tableEvenRowBg = '#fafaf8'

// ── Layout ──────────────────────────────────────────────────────────

/** Top padding of the paper surface (px). */
export const pageMarginTop = 54

/** Side padding of the paper surface (px). */
export const pageMarginSide = 70

/** Max content width of the paper (px). */
export const contentMaxWidth = 820
