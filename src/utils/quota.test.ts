import { describe, expect, it } from 'vitest'
import type { AuthFileItem } from '@/types'
import {
  CODEX_PLAN_FILTER_ALL,
  CODEX_PLAN_FILTER_UNKNOWN,
  filterCodexFilesByPlan,
} from './quota'

function createCodexFile(name: string, planType?: string): AuthFileItem {
  return {
    name,
    type: 'codex',
    ...(planType ? { plan_type: planType } : {}),
  }
}

describe('filterCodexFilesByPlan', () => {
  const codexFiles: AuthFileItem[] = [
    createCodexFile('team-a.json', 'team'),
    createCodexFile('team-b.json', 'TEAM'),
    createCodexFile('plus-a.json', 'plus'),
    createCodexFile('free-a.json', 'free'),
    createCodexFile('unknown-a.json'),
  ]

  it('全部筛选返回所有 codex 凭证', () => {
    expect(filterCodexFilesByPlan(codexFiles, CODEX_PLAN_FILTER_ALL).map(file => file.name)).toEqual([
      'team-a.json',
      'team-b.json',
      'plus-a.json',
      'free-a.json',
      'unknown-a.json',
    ])
  })

  it('按 team 筛选时只返回 team 套餐', () => {
    expect(filterCodexFilesByPlan(codexFiles, 'team').map(file => file.name)).toEqual([
      'team-a.json',
      'team-b.json',
    ])
  })

  it('按 plus 筛选时只返回 plus 套餐', () => {
    expect(filterCodexFilesByPlan(codexFiles, 'plus').map(file => file.name)).toEqual([
      'plus-a.json',
    ])
  })

  it('按未识别筛选时只返回没有套餐信息的凭证', () => {
    expect(filterCodexFilesByPlan(codexFiles, CODEX_PLAN_FILTER_UNKNOWN).map(file => file.name)).toEqual([
      'unknown-a.json',
    ])
  })
})
