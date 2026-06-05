// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SolarAssistant from './SolarAssistant.vue'
import assistantApi from '../services/assistantApi'

vi.mock('../services/assistantApi', () => ({
  default: { chat: vi.fn(), sendFeedback: vi.fn() },
}))

function openPanel(wrapper) {
  return wrapper.get('[data-test="assistant-toggle"]').trigger('click')
}

describe('SolarAssistant.vue', () => {
  it('sends a question and renders the grounded answer + sources', async () => {
    assistantApi.chat.mockResolvedValue({
      answer: 'Oo, ~₱4,000/buwan ang tipid.', sources: ['ROI ng Residential Solar'], message_id: 'm1', conversation_id: 'c1',
    })
    const wrapper = mount(SolarAssistant, { props: { context: 'bill 6000' } })
    await openPanel(wrapper)
    await wrapper.get('[data-test="assistant-input"]').setValue('magkano matitipid?')
    await wrapper.get('[data-test="assistant-send"]').trigger('submit.prevent')
    await flushPromises()

    expect(assistantApi.chat).toHaveBeenCalledWith(expect.objectContaining({
      message: 'magkano matitipid?', context: 'bill 6000',
    }))
    expect(wrapper.text()).toContain('Oo, ~₱4,000/buwan ang tipid.')
    expect(wrapper.text()).toContain('ROI ng Residential Solar')
  })

  it('shows a friendly Taglish message when the assistant is offline', async () => {
    assistantApi.chat.mockRejectedValue(new Error('assistant_unavailable'))
    const wrapper = mount(SolarAssistant)
    await openPanel(wrapper)
    await wrapper.get('[data-test="assistant-input"]').setValue('q')
    await wrapper.get('[data-test="assistant-send"]').trigger('submit.prevent')
    await flushPromises()
    expect(wrapper.text()).toMatch(/offline/i)
  })
})
