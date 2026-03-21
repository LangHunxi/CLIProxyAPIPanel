import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CodexPlanFilterControl from './CodexPlanFilterControl.vue'

describe('CodexPlanFilterControl', () => {
  const options = [
    { value: '__all__', label: '全部' },
    { value: 'team', label: 'team' },
    { value: 'plus', label: 'plus' },
  ]

  it('只渲染一个主题化下拉，并透传选中值与更新事件', async () => {
    const wrapper = mount(CodexPlanFilterControl, {
      props: {
        modelValue: 'team',
        options,
      },
      global: {
        stubs: {
          SearchableSelect: {
            props: [
              'modelValue',
              'options',
              'placeholder',
              'searchPlaceholder',
              'searchable',
              'class',
              'contentClass',
            ],
            emits: ['update:modelValue'],
            template: `
              <button
                class="searchable-select-stub"
                :class="$props.class"
                @click="$emit('update:modelValue', 'plus')"
              >
                {{ modelValue }}
              </button>
            `,
          },
        },
      },
    })

    const control = wrapper.get('.codex-plan-filter-control')
    const select = wrapper.get('.codex-plan-filter-select')

    expect(control.classes()).toContain('inline-flex')
    expect(control.classes()).toContain('items-center')
    expect(control.text()).toBe('team')
    expect(select.classes()).toContain('border-border/60')
    expect(select.classes()).toContain('bg-card/80')
    expect(select.classes()).toContain('shadow-none')
    expect(wrapper.text()).not.toContain('Plan')
    expect(wrapper.text()).not.toContain('Codex 套餐筛选')

    await wrapper.get('.searchable-select-stub').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['plus']])
  })
})
