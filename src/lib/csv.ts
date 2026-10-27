/**
 * CSV export helper. Used server-side (in API routes / actions) to deliver
 * properly-quoted CSV to the browser as a download.
 *
 * - Quotes every field with double quotes.
 * - Escapes embedded double quotes by doubling them.
 * - Escapes embedded newlines by wrapping in quotes (preserved as-is).
 * - Prepends a UTF-8 BOM so Excel reads Amharic characters correctly.
 */
export function toCSV(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): string {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const s = String(value)
    return `"${s.replace(/"/g, '""')}"`
  }
  const header = columns.map((c) => escape(c.label)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key])).join(','))
    .join('\n')
  // Prepend UTF-8 BOM (Excel-friendly for non-ASCII text).
  return `\uFEFF${header}\n${body}`
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
