import { computed, ref } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthFileCard from './AuthFileCard.vue'

const loadStats = vi.fn()

const emptyStatusBar = {
  blocks: Array.from({ length: 48 }, () => 'idle'),
  blockStats: Array.from({ length: 48 }, () => ({ success: 0, failure: 0, successRate: 100 })),
  successRate: 100,
  totalSuccess: 0,
  totalFailure: 0,
}

vi.mock('@/composables/useQuota', () => ({
  useQuota: () => ({
    quotaState: computed(() => ({ status: 'idle' })),
    loading: ref(false),
    loadQuota: vi.fn(),
    resetQuota: vi.fn(),
  }),
}))

vi.mock('@/stores/authStats', () => ({
  useAuthStatsStore: () => ({
    loaded: true,
    loadStats,
    normalizeAuthIndex: () => null,
    getStatsByAuthId: () => ({ success: 0, failure: 0 }),
    getStatsByAuthIndex: () => ({ success: 0, failure: 0 }),
    getStatsBySource: () => ({ success: 0, failure: 0 }),
    getStatusBarDataByAuthId: () => emptyStatusBar,
    getStatusBarData: () => emptyStatusBar,
  }),
}))

describe('AuthFileCard status message', () => {
  beforeEach(() => {
    loadStats.mockClear()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const mountCard = (statusMessage: string) =>
    mount(AuthFileCard, {
      attachTo: document.body,
      props: {
        file: {
          name: 'codex-test.json',
          type: 'codex',
          status_message: statusMessage,
          size: 1234,
        },
      },
      global: {
        provide: {
          quotaRefreshTrigger: ref(new Set<string>()),
        },
      },
    })

  it('工具栏显示报错信息按钮并通过弹窗展示完整内容', async () => {
    const longStatusMessage = [
      'Request failed with status code 401',
      'token_invalidated',
      'The access token has expired and needs re-authentication.',
      'stack: at fetchCredential (/app/auth.js:10:2)',
      'stack: at retryRequest (/app/retry.js:45:8)',
    ].join('\n')

    const wrapper = mountCard(longStatusMessage)

    expect(wrapper.text()).not.toContain('上次请求错误:')
    expect(wrapper.text()).not.toContain('token_invalidated')
    expect(wrapper.text()).not.toContain('报错信息')
    expect(wrapper.find('[data-testid="status-message-button"]').exists()).toBe(true)

    await wrapper.get('[data-testid="status-message-button"]').trigger('click')

    expect(document.body.textContent).toContain('上次报错信息')
    expect(document.body.textContent).toContain('stack: at retryRequest (/app/retry.js:45:8)')
  })

  it('有错误时即使文案较短也显示报错信息按钮', () => {
    const wrapper = mountCard('token_invalidated')

    expect(wrapper.find('[data-testid="status-message-button"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('token_invalidated')
  })

  it('健康状态不显示报错信息按钮', () => {
    const wrapper = mountCard('ok')

    expect(wrapper.find('[data-testid="status-message-button"]').exists()).toBe(false)
  })
})
