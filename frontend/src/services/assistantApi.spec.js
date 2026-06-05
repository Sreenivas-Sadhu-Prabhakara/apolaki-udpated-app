import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import assistantApi from './assistantApi'

describe('assistantApi', () => {
  beforeEach(() => { vi.restoreAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('chat posts to /api/assistant/chat with credentials and returns data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, answer: 'Oo, makakatipid ka.', sources: ['ROI'], message_id: 'm1' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await assistantApi.chat({ message: 'magkano matitipid?', mode: 'customer', context: 'bill 6000' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/assistant/chat')
    expect(opts.method).toBe('POST')
    expect(opts.credentials).toBe('include')
    expect(JSON.parse(opts.body)).toMatchObject({ message: 'magkano matitipid?', mode: 'customer', context: 'bill 6000' })
    expect(res.answer).toBe('Oo, makakatipid ka.')
    expect(res.sources).toEqual(['ROI'])
  })

  it('chat throws on non-ok with server error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 502, json: async () => ({ error: 'assistant_unavailable' }),
    }))
    await expect(assistantApi.chat({ message: 'q' })).rejects.toThrow('assistant_unavailable')
  })

  it('sendFeedback posts message_id + rating', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    vi.stubGlobal('fetch', fetchMock)
    await assistantApi.sendFeedback({ messageId: 'm1', rating: 'up' })
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/assistant/feedback')
    expect(JSON.parse(opts.body)).toEqual({ message_id: 'm1', rating: 'up' })
  })
})
