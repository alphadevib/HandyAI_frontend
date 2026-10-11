import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

describe('content security policy', () => {
  const vercel = JSON.parse(read('vercel.json'))
  const csp = vercel.headers
    .flatMap((block) => block.headers)
    .find((header) => header.key === 'Content-Security-Policy').value

  it('allows exactly the inline theme script in index.html', () => {
    const scripts = [...read('index.html').matchAll(/<script>([\s\S]*?)<\/script>/g)]
    expect(scripts).toHaveLength(1)
    const hash = createHash('sha256').update(scripts[0][1]).digest('base64')
    // If this fails, the inline script changed: put the new hash in vercel.json.
    expect(csp).toContain(`'sha256-${hash}'`)
  })

  it('lets the page talk to the API and nothing else', () => {
    expect(csp).toMatch(/connect-src 'self' https:\/\/handyai-backend-[\w-]+\.onrender\.com/)
    expect(csp).toContain("frame-ancestors 'none'")
  })
})
