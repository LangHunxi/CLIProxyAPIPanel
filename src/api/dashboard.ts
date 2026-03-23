import { apiClient } from './client'

export interface DashboardStat {
  name: string
  value: string
  subValue?: string
  change?: string
  changeType?: 'increase' | 'decrease' | 'neutral'
  extraBadge?: string
  icon: string
}

export interface RecentRequest {
  id: string // UUID
  user: string
  model: string
  tokens: number
  time: string
}

export interface ProviderStatus {
  name: string
  status: 'active' | 'inactive'
  requests: number
}

// 系统健康指标（管理员专用）
export interface SystemHealth {
  avg_response_time: number
  error_rate: number
  error_requests: number
  fallback_count: number
  total_requests: number
}

// 成本统计（管理员专用）
export interface CostStats {
  total_cost: number
  total_actual_cost: number
  cost_savings: number
}

// 缓存统计
export interface CacheStats {
  cache_creation_tokens: number
  cache_read_tokens: number
  cache_creation_cost?: number
  cache_read_cost?: number
  cache_hit_rate?: number
  total_cache_tokens: number
}

// 用户统计（管理员专用）
export interface UserStats {
  total: number
  active: number
}

// Token 详细分类
export interface TokenBreakdown {
  input: number
  output: number
  cache_creation: number
  cache_read: number
}

export interface DashboardStatsResponse {
  stats: DashboardStat[]
  today?: {
    requests: number
    tokens: number
    cost: number
    actual_cost?: number
    cache_creation_tokens?: number
    cache_read_tokens?: number
  }
  api_keys?: {
    total: number
    active: number
  }
  tokens?: {
    month: number
  }
  // 管理员专用字段
  system_health?: SystemHealth
  cost_stats?: CostStats
  cache_stats?: CacheStats
  users?: UserStats
  token_breakdown?: TokenBreakdown
  // 普通用户专用字段
  monthly_cost?: number
}

export interface RecentRequestsResponse {
  requests: RecentRequest[]
}

export interface ProviderStatusResponse {
  providers: ProviderStatus[]
}

export interface RequestDetail {
  id: string // UUID
  request_id: string
  user: {
    id: string // UUID
    username: string
    email: string
  }
  api_key: {
    id: string // UUID
    name: string
    display: string
  }
  provider: string
  api_format?: string
  model: string
  target_model?: string | null  // 映射后的目标模型名
  tokens: {
    input: number
    output: number
    total: number
  }
  cost: {
    input: number
    output: number
    total: number
  }
  // Additional token fields
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
  // Additional cost fields
  input_cost?: number
  output_cost?: number
  total_cost?: number
  cache_creation_cost?: number
  cache_read_cost?: number
  request_cost?: number  // 按次计费费用
  // Historical pricing fields (per 1M tokens)
  input_price_per_1m?: number
  output_price_per_1m?: number
  cache_creation_price_per_1m?: number
  cache_read_price_per_1m?: number
  price_per_request?: number  // 按次计费价格
  request_type: string
  is_stream: boolean
  status_code: number
  error_message?: string
  response_time_ms: number
  created_at: string
  request_headers?: Record<string, any>
  request_body?: Record<string, any>
  provider_request_headers?: Record<string, any>
  response_headers?: Record<string, any>
  response_body?: Record<string, any>
  metadata?: Record<string, any>
  // 阶梯计费信息
  tiered_pricing?: {
    total_input_context: number  // 总输入上下文 (input + cache_read)
    tier_index: number  // 命中的阶梯索引 (0-based)
    tier_count: number  // 阶梯总数
    source?: 'provider' | 'global'  // 定价来源: 提供商或全局
    current_tier: {  // 当前命中的阶梯配置
      up_to?: number | null
      input_price_per_1m: number
      output_price_per_1m: number
      cache_creation_price_per_1m?: number
      cache_read_price_per_1m?: number
      cache_ttl_pricing?: Array<{
        ttl_minutes: number
        cache_read_price_per_1m: number
      }>
    }
    tiers: Array<{  // 完整阶梯配置列表
      up_to?: number | null
      input_price_per_1m: number
      output_price_per_1m: number
      cache_creation_price_per_1m?: number
      cache_read_price_per_1m?: number
      cache_ttl_pricing?: Array<{
        ttl_minutes: number
        cache_read_price_per_1m: number
      }>
    }>
  } | null
}

export interface ModelBreakdown {
  model: string
  requests: number
  tokens: number
  cost: number
}

export interface ModelSummary {
  model: string
  requests: number
  tokens: number
  cost: number
  avg_response_time: number
  cost_per_request: number
  tokens_per_request: number
}

export interface DailyStat {
  date: string // ISO date string
  requests: number
  tokens: number
  cost: number
  avg_response_time: number // in seconds
  unique_models: number
  unique_providers: number
  model_breakdown: ModelBreakdown[]
}

export interface DailyStatsResponse {
  daily_stats: DailyStat[]
  model_summary: ModelSummary[]
  period: {
    start_date: string
    end_date: string
    days: number
  }
}

// 新的统一仪表盘统计接口 (CLIProxyAPI /management/dashboard/stats)
export interface OverviewStats {
  total_requests: number
  success_requests: number
  failure_requests: number
  total_tokens: number
  input_tokens: number
  output_tokens: number
}

export interface SystemHealthStats {
  avg_response_time: number  // in seconds
  error_rate: number         // percentage
  unique_models: number
  unique_providers: number
}

export interface DailyStatsItem {
  date: string
  requests: number
  tokens: number
  avg_response_time: number  // in seconds
  unique_models: number
}

export interface TrendPoint {
  date: string
  requests: number
}

export interface ModelCount {
  model: string
  requests: number
}

export interface UnifiedDashboardStats {
  overview: OverviewStats
  system_health: SystemHealthStats
  daily_stats: DailyStatsItem[]
  request_trend: TrendPoint[]
  model_counts: ModelCount[]
}

export const dashboardApi = {
  // 获取仪表盘统计数据 (旧接口,兼容 Aether 后端)
  async getStats(): Promise<DashboardStatsResponse> {
    return apiClient.get<DashboardStatsResponse>('/api/dashboard/stats')
  },

  // 获取统一的仪表盘统计数据 (新接口,用于 CLIProxyAPI 后端)
  async getUnifiedStats(days: number = 7): Promise<UnifiedDashboardStats> {
    return apiClient.get<UnifiedDashboardStats>('/dashboard/stats', {
      params: { days }
    })
  },

  // 获取最近的请求记录
  async getRecentRequests(limit: number = 10): Promise<RecentRequest[]> {
    const response = await apiClient.get<RecentRequestsResponse>('/api/dashboard/recent-requests', {
      params: { limit }
    })
    return response.requests
  },

  // 获取提供商状态
  async getProviderStatus(): Promise<ProviderStatus[]> {
    const response = await apiClient.get<ProviderStatusResponse>('/api/dashboard/provider-status')
    return response.providers
  },

  // 获取请求详情
  async getRequestDetail(requestId: string): Promise<RequestDetail> {
    return apiClient.get<RequestDetail>(`/api/admin/usage/${requestId}`)
  },

  // 获取每日统计数据
  async getDailyStats(days: number = 7): Promise<DailyStatsResponse> {
    return apiClient.get<DailyStatsResponse>('/api/dashboard/daily-stats', {
      params: { days }
    })
  }
}
