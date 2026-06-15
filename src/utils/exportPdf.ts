import { renderMarkdown, highlightCodeBlocks } from './markdown'
import {
  pageBackground,
  paperBackground,
  bodyFont,
  bodyColor,
  bodyFontSize,
  bodyLineHeight,
  headingColor,
  h4Color,
  inlineCodeBg,
  inlineCodeColor,
  codeFont,
  codeBlockBg,
  codeBlockTextColor,
  codeBlockFontSize,
  codeBlockLineHeight,
  blockquoteBg,
  blockquoteBorderColor,
  blockquoteTextColor,
  blockquoteBorderWidth,
  hrColor,
  tableHeaderBg,
  tableHeaderTextColor,
  tableBorderColor,
  tableStrongBorderColor,
  tableCellPadding,
  tableEvenRowBg,
  linkColor,
  pageMarginTop,
  pageMarginSide,
  contentMaxWidth,
} from './documentExportTheme'

const PRINT_CLEANUP_DELAY_MS = 30_000

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Build a self-contained HTML document that mirrors the reading mode
 * visual design, ready for system print → Save as PDF.
 */
async function buildPrintHtml(markdown: string, title = 'export.pdf'): Promise<string> {
  // Render markdown and apply Shiki highlighting
  const container = document.createElement('div')
  container.innerHTML = renderMarkdown(markdown)
  await highlightCodeBlocks(container)
  const bodyHtml = container.innerHTML

  // Build reader CSS from theme values (mirrors src/styles/reader.css)
  const readerCss = /* css */ `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      background: ${pageBackground};
      font-family: ${bodyFont};
      color: ${bodyColor};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .reader-content {
      max-width: ${contentMaxWidth}px;
      margin: ${pageMarginTop}px auto 72px;
      padding: ${pageMarginTop}px ${pageMarginSide}px 80px;
      background: ${paperBackground};
      line-height: ${bodyLineHeight};
      font-size: ${bodyFontSize}px;
      color: ${bodyColor};
    }

    .reader-content h1 {
      font-size: 44px; font-weight: 900; line-height: 0.98;
      margin: 0 0 0.65em; padding-bottom: 0.35em;
      border-bottom: 1px solid #1d1d1b;
      color: ${headingColor}; text-transform: uppercase;
    }
    .reader-content h2 {
      font-size: 28px; font-weight: 850; line-height: 1.05;
      margin: 1.35em 0 0.45em; color: ${headingColor};
    }
    .reader-content h3 {
      font-size: 20px; font-weight: 800;
      margin: 1.1em 0 0.35em; color: ${headingColor};
    }
    .reader-content h4 {
      font-size: 16px; font-weight: 800;
      margin: 0.6em 0 0.3em; color: ${h4Color}; text-transform: uppercase;
    }
    .reader-content h5, .reader-content h6 {
      font-size: 1em; font-weight: 750;
      margin: 0.5em 0 0.2em; color: #6f716f;
    }

    .reader-content p { margin: 0.7em 0; }

    .reader-content code {
      background: ${inlineCodeBg}; border: 1px solid #d8d8d4;
      border-radius: 3px; padding: 2px 6px;
      font-family: ${codeFont}; font-size: 0.9em; color: ${inlineCodeColor};
    }

    .reader-content pre {
      background: ${codeBlockBg}; border-radius: 6px;
      padding: 18px 20px; overflow-x: auto; margin: 1.2em 0;
    }
    .reader-content pre code {
      background: none; border: none; padding: 0;
      font-size: ${codeBlockFontSize}px; line-height: ${codeBlockLineHeight};
      color: ${codeBlockTextColor};
    }

    .reader-content blockquote {
      margin: 1.15em 0; padding: 8px 18px;
      border-left: ${blockquoteBorderWidth}px solid ${blockquoteBorderColor};
      background: ${blockquoteBg}; color: ${blockquoteTextColor};
    }

    .reader-content table {
      width: 100%; border-collapse: collapse; margin: 1.25em 0;
      font-size: 14px;
      border-top: 1px solid ${tableStrongBorderColor};
      border-bottom: 1px solid ${tableStrongBorderColor};
    }
    .reader-content thead { background: ${tableHeaderBg}; }
    .reader-content th {
      padding: 9px ${tableCellPadding}px;
      border: 1px solid ${tableBorderColor};
      font-weight: 800; text-align: left; color: ${tableHeaderTextColor};
    }
    .reader-content td {
      padding: 8px ${tableCellPadding}px;
      border: 1px solid ${tableBorderColor};
    }
    .reader-content tr:nth-child(even) td { background: ${tableEvenRowBg}; }

    .reader-content ul, .reader-content ol { padding-left: 1.8em; margin: 0.5em 0; }
    .reader-content li { margin: 0.2em 0; }
    .reader-content input[type="checkbox"] { margin-right: 6px; }

    .reader-content img {
      max-width: 100%; border-radius: 6px; margin: 1em 0;
      border: 1px solid ${tableBorderColor};
    }

    .reader-content hr {
      border: none; border-top: 1px solid ${hrColor}; margin: 2em 0;
    }

    .reader-content a {
      color: ${linkColor}; text-decoration: underline;
      text-decoration-thickness: 1px; text-underline-offset: 3px;
    }
  `

  // Print-specific CSS (mirrors src/styles/print.css)
  const printCss = /* css */ `
    @page { size: A4; margin: 12mm 15mm; }

    .reader-content {
      max-width: none !important; margin: 0 !important;
      padding: 0 !important; border: none !important;
      box-shadow: none !important; background: transparent !important;
      min-height: auto !important;
      font-size: 12pt !important; line-height: 1.6 !important;
    }

    .reader-content h1 { font-size: 24pt !important; page-break-after: avoid; }
    .reader-content h2 { font-size: 18pt !important; page-break-after: avoid; }
    .reader-content h3 { font-size: 14pt !important; page-break-after: avoid; }
    .reader-content h4 { font-size: 12pt !important; page-break-after: avoid; }

    .reader-content pre,
    .reader-content blockquote,
    .reader-content table { page-break-inside: avoid; }
    .reader-content tr { page-break-inside: avoid; }

    .reader-content pre {
      white-space: pre-wrap !important; word-break: break-word !important;
      overflow-x: visible !important; font-size: 10pt !important;
    }
    .reader-content pre code {
      white-space: pre-wrap !important; word-break: break-word !important;
    }

    .reader-content table { font-size: 10pt !important; }
    .reader-content th, .reader-content td { word-break: break-word; }
    .reader-content img { max-width: 100% !important; page-break-inside: avoid; }
  `

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtmlText(title)}</title>
  <style>${readerCss}</style>
  <style>${printCss}</style>
</head>
<body>
  <div class="reader-content">${bodyHtml}</div>
</body>
</html>`
}

/**
 * Export the current Markdown content to PDF via the system print dialog.
 *
 * Creates a hidden iframe with a self-contained HTML document that mirrors
 * the reading mode visual design, then triggers window.print(). The user
 * selects "Save as PDF" in their system print dialog.
 *
 * Supported on macOS (Save as PDF in print dialog) and
 * Windows (Microsoft Print to PDF).
 */
export async function exportPdf(markdown: string, suggestedFileName?: string): Promise<void> {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.top = '0'
  iframe.style.left = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  iframe.style.visibility = 'hidden'
  iframe.setAttribute('aria-hidden', 'true')

  document.body.appendChild(iframe)

  return new Promise<void>((resolve, reject) => {
    let settled = false
    let cleanupTimer: ReturnType<typeof setTimeout> | null = null

    const cleanup = () => {
      try {
        if (cleanupTimer) {
          clearTimeout(cleanupTimer)
          cleanupTimer = null
        }
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe)
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    const resolveOnce = () => {
      if (settled) return
      settled = true
      resolve()
    }

    const rejectOnce = (err: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(err)
    }

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow
        if (!win) {
          rejectOnce(new Error('Could not access print window'))
          return
        }

        // Best-effort cleanup if the WebView reports print completion.
        win.addEventListener('afterprint', () => {
          cleanup()
          resolveOnce()
        }, { once: true })

        // Some engines report print dialog state through matchMedia.
        const mediaQuery = win.matchMedia('print')
        if ('addEventListener' in mediaQuery) {
          mediaQuery.addEventListener('change', (e) => {
            if (!e.matches) {
              cleanup()
              resolveOnce()
            }
          }, { once: true })
        }

        // Trigger print after a small delay to ensure rendering.
        // Tauri/WebView does not reliably fire afterprint, so resolve once
        // the print dialog has been requested instead of blocking the toolbar.
        setTimeout(() => {
          win.print()
          cleanupTimer = setTimeout(cleanup, PRINT_CLEANUP_DELAY_MS)
          resolveOnce()
        }, 100)
      } catch (err) {
        rejectOnce(err instanceof Error ? err : new Error(String(err)))
      }
    }

    iframe.onerror = () => {
      rejectOnce(new Error('Failed to load print document'))
    }

    // Build the HTML and write to iframe
    buildPrintHtml(markdown, suggestedFileName)
      .then((html) => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc) {
          doc.open()
          doc.write(html)
          doc.close()
        } else {
          rejectOnce(new Error('Could not access print document'))
        }
      })
      .catch((err) => {
        rejectOnce(err instanceof Error ? err : new Error(String(err)))
      })
  })
}
