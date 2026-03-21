<template>
  <div class="codex-plan-filter-control inline-flex items-center">
    <SearchableSelect
      :model-value="modelValue"
      :options="options"
      placeholder="全部套餐"
      search-placeholder="搜索套餐..."
      :searchable="false"
      class="codex-plan-filter-select h-8 w-28 sm:w-32 rounded-lg border-border/60 bg-card/80 px-3 text-xs font-normal text-foreground shadow-none backdrop-blur-0"
      content-class="border-border/60 bg-card text-foreground shadow-lg backdrop-blur-0"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { SearchableSelect } from '@/components/ui'

type CodexPlanOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

const props = defineProps<{
  modelValue: string
  options: CodexPlanOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
