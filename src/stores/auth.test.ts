import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'

describe('useAuthStore update checks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => {
        storage.clear()
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('checks client updates against the maintained panel repository', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: 'v1.2.3' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useAuthStore()
    await store.checkClientUpdate('v1.0.0')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/LangHunxi/CLIProxyAPIPanel/releases/latest',
    )
    expect(store.latestClientVersion).toBe('v1.2.3')
    expect(store.hasClientUpdate).toBe(true)
  })

  it('checks server updates against the maintained backend repository', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: 'v2.0.0' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = useAuthStore()
    await store.checkServerUpdate()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/LangHunxi/CLIProxyAPI/releases/latest',
    )
    expect(store.latestServerVersion).toBe('v2.0.0')
  })
})
