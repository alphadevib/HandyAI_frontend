import { parseMarkdown } from '../markdown'

/** Renders a chat reply's Markdown as React elements (never as raw HTML). */
export default function Markdown({ text }) {
  return (
    <div className="markdown">
      {parseMarkdown(text).map((block, index) => {
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </List>
          )
        }
        if (block.type === 'heading') {
          return (
            <p key={index} className="markdown-heading">
              {renderInline(block.inline)}
            </p>
          )
        }
        return <p key={index}>{renderInline(block.inline)}</p>
      })}
    </div>
  )
}

function renderInline(nodes) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'strong':
        return <strong key={index}>{renderInline(node.children)}</strong>
      case 'em':
        return <em key={index}>{renderInline(node.children)}</em>
      case 'code':
        return <code key={index}>{node.value}</code>
      case 'link':
        return (
          <a key={index} href={node.href} target="_blank" rel="noopener noreferrer">
            {renderInline(node.children)}
          </a>
        )
      default:
        return node.value
    }
  })
}
