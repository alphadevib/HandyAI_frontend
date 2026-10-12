import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown } from '../src/markdown'

describe('markdown', () => {
  it('reads a typical assistant reply: a sentence, then a bullet list with bold names', () => {
    const blocks = parseMarkdown(
      'Here are two picks for your podcast.\n\n' +
        '- **Descript**: edit the audio by editing the transcript.\n' +
        '- **Adobe Podcast Enhance**: removes echo, *free*.',
    )
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toEqual({
      type: 'paragraph',
      inline: [{ type: 'text', value: 'Here are two picks for your podcast.' }],
    })
    expect(blocks[1].type).toBe('list')
    expect(blocks[1].ordered).toBe(false)
    expect(blocks[1].items).toHaveLength(2)
    expect(blocks[1].items[0][0]).toEqual({
      type: 'strong',
      children: [{ type: 'text', value: 'Descript' }],
    })
    expect(blocks[1].items[1]).toContainEqual({ type: 'em', children: [{ type: 'text', value: 'free' }] })
  })

  it('tells numbered lists from bullets and keeps headings', () => {
    const blocks = parseMarkdown('## Options\n1. Gamma\n2. Napkin AI\n* Canva')
    expect(blocks.map((block) => block.type)).toEqual(['heading', 'list', 'list'])
    expect(blocks[1].ordered).toBe(true)
    expect(blocks[1].items).toHaveLength(2)
    expect(blocks[2].ordered).toBe(false)
  })

  it('joins wrapped lines into one paragraph and splits on blank lines', () => {
    const blocks = parseMarkdown('First line\ncontinues here.\n\nSecond paragraph.')
    expect(blocks).toHaveLength(2)
    expect(blocks[0].inline[0].value).toBe('First line continues here.')
  })

  it('handles code and links, and only links to http(s)', () => {
    expect(parseInline('Run `npm run dev` then open [HandyAI](https://handyai.app).')).toEqual([
      { type: 'text', value: 'Run ' },
      { type: 'code', value: 'npm run dev' },
      { type: 'text', value: ' then open ' },
      { type: 'link', href: 'https://handyai.app', children: [{ type: 'text', value: 'HandyAI' }] },
      { type: 'text', value: '.' },
    ])
    expect(parseInline('[click](javascript:alert(1))')).toEqual([
      { type: 'text', value: '[click](javascript:alert(1))' },
    ])
  })

  it('leaves HTML as plain text and does not italicise snake_case or 2 * 3 * 4', () => {
    expect(parseInline('<img src=x onerror=alert(1)>')).toEqual([
      { type: 'text', value: '<img src=x onerror=alert(1)>' },
    ])
    expect(parseInline('use max_tokens_limit')).toEqual([{ type: 'text', value: 'use max_tokens_limit' }])
    expect(parseInline('2 * 3 * 4')).toEqual([{ type: 'text', value: '2 * 3 * 4' }])
  })

  it('copes with empty input', () => {
    expect(parseMarkdown('')).toEqual([])
    expect(parseMarkdown(null)).toEqual([])
  })
})
