/**
 * Auth Store - 管理连接配置和认证状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/api/client'
import { STORAGE_KEY_AUTH } from '@/utils/constants'

export interface ConnectionConfig {
  apiBase: string
  managementKey: string
}

interface StoredAuth {
  apiBase: string
  managementKey: string
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_AUTH)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.apiBase && parsed.managementKey) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return null
}

function saveAuth(config: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(config))
}

function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH)
}

function compareVersions(latest: string, current: string): number {
  const parseVersion = (version: string) => {
    return version.replace(/^v/, '').split('.').map(num => parseInt(num, 10) || 0)
  }

  const latestParts = parseVersion(latest)
  const currentParts = parseVersion(current)
  const maxLength = Math.max(latestParts.length, currentParts.length)

  for (let i = 0; i < maxLength; i++) {
    const latestPart = latestParts[i] || 0
    const currentPart = currentParts[i] || 0

    if (latestPart > currentPart) return 1
    if (latestPart < currentPart) return -1
  }

  return 0
}

export const useAuthStore = defineStore('auth', () => {
  const apiBase = ref('')
  const managementKey = ref('')
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const connectionError = ref<string | null>(null)
  const serverVersion = ref<string | null>(null)
  const serverBuildDate = ref<string | null>(null)
  const latestClientVersion = ref<string | null>(null)
  const latestServerVersion = ref<string | null>(null)
  const hasClientUpdate = ref(false)
  const hasServerUpdate = ref(false)
  const checkingClientUpdate = ref(false)
  const checkingServerUpdate = ref(false)

  const hasCredentials = computed(() => !!apiBase.value && !!managementKey.value)

  const updateClientFlag = (currentVersion: string) => {
    if (!latestClientVersion.value || currentVersion === '未知') {
      hasClientUpdate.value = false
      return
    }
    hasClientUpdate.value = compareVersions(latestClientVersion.value, currentVersion) > 0
  }

  const updateServerFlag = () => {
    if (!latestServerVersion.value || !serverVersion.value) {
      hasServerUpdate.value = false
      return
    }
    hasServerUpdate.value = compareVersions(latestServerVersion.value, serverVersion.value) > 0
  }

  /**
   * 初始化 - 从 localStorage 恢复连接配置
   */
  function init(): void {
    const stored = loadStoredAuth()
    if (stored) {
      apiBase.value = stored.apiBase
      managementKey.value = stored.managementKey
      apiClient.setConfig({
        apiBase: stored.apiBase,
        managementKey: stored.managementKey
      })
    }

    // 监听版本更新事件
    window.addEventListener('server-version-update', (event) => {
      const detail = (event as CustomEvent).detail
      if (detail.version) serverVersion.value = detail.version
      if (detail.buildDate) serverBuildDate.value = detail.buildDate
      updateServerFlag()
    })

    // 监听 401 未授权事件
    window.addEventListener('unauthorized', () => {
      disconnect()
    })
  }

  /**
   * 连接到服务器
   */
  async function connect(config: ConnectionConfig): Promise<boolean> {
    isConnecting.value = true
    connectionError.value = null

    try {
      apiClient.setConfig({
        apiBase: config.apiBase,
        managementKey: config.managementKey
      })

      // 验证连接 - 尝试获取配置（这会触发版本信息更新）
      await apiClient.get('/config')

      // 保存配置
      apiBase.value = config.apiBase
      managementKey.value = config.managementKey
      isConnected.value = true
      saveAuth(config)

      return true
    } catch (error) {
      connectionError.value = (error as Error).message || '连接失败'
      isConnected.value = false
      return false
    } finally {
      isConnecting.value = false
    }
  }

  /**
   * 断开连接
   */
  function disconnect(): void {
    apiBase.value = ''
    managementKey.value = ''
    isConnected.value = false
    serverVersion.value = null
    serverBuildDate.value = null
    hasServerUpdate.value = false
    clearAuth()
  }

  /**
   * 尝试自动连接（如果有保存的凭证）
   */
  async function autoConnect(): Promise<boolean> {
    const stored = loadStoredAuth()
    if (stored) {
      try {
        return await connect(stored)
      } catch (error) {
        // 自动连接失败时清除存储的凭证
        clearAuth()
        return false
      }
    }
    return false
  }

  async function checkClientUpdate(currentVersion: string): Promise<void> {
    if (checkingClientUpdate.value) return

    checkingClientUpdate.value = true
    try {
      const response = await fetch('https://api.github.com/repos/LangHunxi/CLIProxyAPIPanel/releases/latest')
      if (!response.ok) throw new Error('Failed to fetch latest release')

      const data = await response.json()
      latestClientVersion.value = data.tag_name
      updateClientFlag(currentVersion)
    } catch (error) {
      console.warn('Failed to check client update:', error)
    } finally {
      checkingClientUpdate.value = false
    }
  }

  async function checkServerUpdate(): Promise<void> {
    if (checkingServerUpdate.value) return

    checkingServerUpdate.value = true
    try {
      const response = await fetch('https://api.github.com/repos/LangHunxi/CLIProxyAPI/releases/latest')
      if (!response.ok) throw new Error('Failed to fetch latest release')

      const data = await response.json()
      latestServerVersion.value = data.tag_name
      updateServerFlag()
    } catch (error) {
      console.warn('Failed to check server update:', error)
    } finally {
      checkingServerUpdate.value = false
    }
  }

  /**
   * 刷新服务器版本信息
   */
  async function refreshServerInfo(): Promise<void> {
    if (!isConnected.value) return
    
    try {
      // 发起一个简单的请求来触发版本信息更新
      await apiClient.get('/config')
    } catch (error) {
      // 忽略错误，版本信息不是关键功能
      console.warn('Failed to refresh server info:', error)
    }
  }

  return {
    apiBase,
    managementKey,
    isConnected,
    isConnecting,
    connectionError,
    serverVersion,
    serverBuildDate,
    latestClientVersion,
    latestServerVersion,
    hasClientUpdate,
    hasServerUpdate,
    checkingClientUpdate,
    checkingServerUpdate,
    hasCredentials,
    init,
    connect,
    disconnect,
    autoConnect,
    refreshServerInfo,
    checkClientUpdate,
    checkServerUpdate
  }
})
