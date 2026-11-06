/** Shared, inert formatting for outgoing HTML and its preview. */
export const escapeMailHtml = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const properties = new Set('color background-color font-family font-size font-weight font-style text-decoration text-align line-height width max-width height padding padding-top padding-right padding-bottom padding-left margin margin-top margin-right margin-bottom margin-left border border-top border-right border-bottom border-left border-collapse vertical-align white-space'.split(' '))
export function mailStyles(value: unknown): Record<string, string> {
  const styles: Record<string, string> = {}
  if (typeof value !== 'string' || value.length > 4096) return styles
  for (const item of value.split(';')) {
    const split = item.indexOf(':'), name = item.slice(0, split).trim().toLowerCase(), content = item.slice(split + 1).trim()
    if (split < 1 || !properties.has(name) || !content || content.length > 120 || !/^[a-z0-9#.,%() +/"-]+$/i.test(content) || /url|expression|behavior|javascript|var\s*\(|!important/i.test(content)) continue
    // Bound layout sizes so preview content cannot create giant offscreen controls.
    if (/^(?:width|max-width|height|padding|margin|font-size)/.test(name) && [...content.matchAll(/\d+(?:\.\d+)?/g)].some(n => Number(n[0]) > 2000)) continue
    if (/font-size|padding|margin/.test(name) && [...content.matchAll(/\d+(?:\.\d+)?/g)].some(n => Number(n[0]) > 64)) continue
    styles[name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = content
  }
  return styles
}
