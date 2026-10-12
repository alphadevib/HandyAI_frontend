/**
 * A small Markdown parser for chat replies: paragraphs, headings, bullet and numbered lists, and
 * inline **bold**, *italic*, `code` and [links](https://...).
 *
 * It returns a plain tree instead of HTML, and components/Markdown.jsx turns that tree into React
 * elements, so nothing in a reply can inject markup or script. Links are kept only for http(s)
 * addresses.
 */

const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/
const HEADING = /^\s*#{1,3}\s+(.*)$/
const INLINE =
  /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(?<![\w*])\*(?!\s)([^*]+?)\*(?![\w*])|(?<!\w)_(?!\s)([^_]+?)_(?!\w)/g

/** Block structure: [{ type: 'paragraph' | 'heading', inline } | { type: 'list', ordered, items }] */
export function parseMarkdown(text) {
  const blocks = []
  let paragraph = []
  let list = null

  const closeParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'paragraph', inline: parseInline(paragraph.join(' ')) })
      paragraph = []
    }
  }
  const closeList = () => {
    if (list) {
      blocks.push(list)
      list = null
    }
  }

  for (const line of String(text ?? '').split(/\r?\n/)) {
    const bullet = line.match(BULLET)
    const numbered = bullet ? null : line.match(NUMBERED)
    const heading = line.match(HEADING)
    if (bullet || numbered) {
      closeParagraph()
      const ordered = Boolean(numbered)
      if (!list || list.ordered !== ordered) {
        closeList()
        list = { type: 'list', ordered, items: [] }
      }
      list.items.push(parseInline((bullet ?? numbered)[1]))
    } else if (heading) {
      closeParagraph()
      closeList()
      blocks.push({ type: 'heading', inline: parseInline(heading[1]) })
    } else if (!line.trim()) {
      closeParagraph()
      closeList()
    } else if (list && /^\s{2,}\S/.test(line)) {
      // An indented line continues the last list item.
      const last = list.items[list.items.length - 1]
      last.push({ type: 'text', value: ' ' }, ...parseInline(line.trim()))
    } else {
      closeList()
      paragraph.push(line.trim())
    }
  }
  closeParagraph()
  closeList()
  return blocks
}

/** Inline nodes: text, strong, em, code and link. */
export function parseInline(text) {
  const nodes = []
  let last = 0
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) nodes.push({ type: 'text', value: text.slice(last, match.index) })
    const [, strong, code, linkText, href, starEm, underscoreEm] = match
    if (strong !== undefined) nodes.push({ type: 'strong', children: parseInline(strong) })
    else if (code !== undefined) nodes.push({ type: 'code', value: code })
    else if (linkText !== undefined) nodes.push({ type: 'link', href, children: parseInline(linkText) })
    else nodes.push({ type: 'em', children: parseInline(starEm ?? underscoreEm) })
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push({ type: 'text', value: text.slice(last) })
  return nodes
}
