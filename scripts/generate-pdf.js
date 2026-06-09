// Converts GUIDE.md to GUIDE.pdf using Playwright
// Run: node scripts/generate-pdf.js

import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const md = readFileSync(resolve(root, 'GUIDE.md'), 'utf8')

// Simple markdown → HTML converter for our guide's content
function mdToHtml(text) {
  return text
    // Headers
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr>')
    // Tables — collect rows per table
    .replace(/(\|.+\|\n)+/g, (table) => {
      const rows = table.trim().split('\n')
      let html = '<table>'
      rows.forEach((row, i) => {
        if (row.match(/^\|[-| ]+\|$/)) return // separator row
        const cells = row.split('|').slice(1, -1).map(c => c.trim())
        const tag = i === 0 ? 'th' : 'td'
        html += '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>'
      })
      html += '</table>'
      return html
    })
    // Unordered lists
    .replace(/(^- .+\n?)+/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`)
      return '<ul>' + items.join('') + '</ul>'
    })
    // Ordered lists
    .replace(/(^\d+\. .+\n?)+/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`)
      return '<ol>' + items.join('') + '</ol>'
    })
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>')
    // Clean up extra blank lines
    .replace(/\n{3,}/g, '\n\n')
}

const body = mdToHtml(md)

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #010100;
    padding: 48px 56px;
    max-width: 800px;
    margin: 0 auto;
  }
  h1 {
    font-size: 22pt;
    font-weight: 700;
    color: #02348E;
    margin-bottom: 4px;
    padding-bottom: 10px;
    border-bottom: 2px solid #02348E;
  }
  h1 + p { color: #555; font-size: 10pt; margin-top: 4px; margin-bottom: 20px; }
  h2 {
    font-size: 14pt;
    font-weight: 700;
    color: #02348E;
    margin-top: 32px;
    margin-bottom: 10px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e0e4f0;
  }
  h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #010100;
    margin-top: 18px;
    margin-bottom: 6px;
  }
  p { margin-bottom: 10px; }
  ul, ol { margin: 8px 0 10px 22px; }
  li { margin-bottom: 4px; }
  strong { font-weight: 600; }
  code {
    background: #f0f2f7;
    border-radius: 3px;
    padding: 1px 5px;
    font-family: 'SF Mono', Consolas, monospace;
    font-size: 9.5pt;
    color: #02348E;
  }
  hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 24px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px;
    font-size: 10pt;
  }
  th {
    background: #02348E;
    color: white;
    text-align: left;
    padding: 7px 10px;
    font-weight: 600;
  }
  td {
    padding: 6px 10px;
    border-bottom: 1px solid #f0f2f7;
  }
  tr:nth-child(even) td { background: #f8f9fc; }
  a { color: #02348E; }
  em { font-style: italic; color: #666; font-size: 9.5pt; }
</style>
</head>
<body>
${body}
</body>
</html>`

const htmlPath = resolve(root, '.tmp', 'guide-preview.html')
writeFileSync(htmlPath, html, 'utf8')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`)
await page.waitForLoadState('networkidle')

const pdfPath = resolve(root, 'GUIDE.pdf')
await page.pdf({
  path: pdfPath,
  format: 'Letter',
  margin: { top: '0.5in', bottom: '0.5in', left: '0.6in', right: '0.6in' },
  printBackground: true,
})

await browser.close()
console.log('GUIDE.pdf generated successfully')
