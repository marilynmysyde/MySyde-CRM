// src/lib/csvExport.js
// Client-side CSV generation and download. No server required.

/**
 * Convert an array of objects to a CSV string.
 * @param {object[]} rows
 * @param {string[]} columns  - keys to include (in order)
 * @param {object}   headers  - { key: 'Display Label' } overrides
 */
export function toCsv(rows, columns, headers = {}) {
  const headerRow = columns.map(c => `"${headers[c] ?? c}"`).join(',')
  const dataRows  = rows.map(row =>
    columns.map(c => {
      const val = row[c] ?? ''
      const str = Array.isArray(val) ? val.join('; ') : String(val)
      return `"${str.replace(/"/g, '""')}"`
    }).join(',')
  )
  return [headerRow, ...dataRows].join('\r\n')
}

/**
 * Trigger a CSV file download in the browser.
 * @param {string} csv       - CSV string
 * @param {string} filename  - e.g. 'deals-2026-05-21.csv'
 */
export function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Convenience: build + download in one call */
export function exportCsv(rows, columns, headers, filename) {
  downloadCsv(toCsv(rows, columns, headers), filename)
}

/** Today's date as YYYY-MM-DD for filenames */
export function todaySlug() {
  return new Date().toISOString().slice(0, 10)
}
