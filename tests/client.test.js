import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OFFLINE_MESSAGE, RETRY_DELAYS_MS, api } from '../src/api/client'

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const html = (status) => new Response('<!DOCTYPE html><title>502</title>', { status })

describe('api client', () => {
  const delays = [...RETRY_DELAYS_MS]

  beforeEach(() => {
    // No real waiting between retries in tests.
    RETRY_DELAYS_MS.splice(0, RETRY_DELAYS_MS.length, 0, 0, 0)
  })

  afterEach(() => {
    RETRY_DELAYS_MS.splice(0, RETRY_DELAYS_MS.length, ...delays)
    vi.unstubAllGlobals()
  })

  it('retries a read while the server restarts, then returns the data', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(html(502))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(json(200, [{ slug: 'claude' }]))
    vi.stubGlobal('fetch', fetch)

    await expect(api.categories()).resolves.toEqual([{ slug: 'claude' }])
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('gives up with a friendly message, never a configuration hint', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => html(502)))

    const error = await api.stats().catch((caught) => caught)
    expect(error.message).toBe(OFFLINE_MESSAGE)
    expect(error.message).not.toMatch(/VITE_|backend/)
  })

  it('never retries a write, so nothing is sent twice', async () => {
    const fetch = vi.fn(async () => html(503))
    vi.stubGlobal('fetch', fetch)

    await expect(api.login({ email: 'a@b.c', password: 'x' })).rejects.toThrow(OFFLINE_MESSAGE)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('passes the server message through for ordinary errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json(401, { message: 'Email or password is incorrect' })),
    )

    await expect(api.login({ email: 'a@b.c', password: 'x' })).rejects.toMatchObject({
      status: 401,
      message: 'Email or password is incorrect',
    })
  })
})
