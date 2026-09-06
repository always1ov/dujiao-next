<template>
  <ol class="md3-stepper flex-wrap" :aria-label="t('checkoutSteps.label')">
    <template v-for="(s, i) in steps" :key="s.key">
      <li class="md3-step" :class="{ 'is-on': stateOf(s.key) === 'on', 'is-done': stateOf(s.key) === 'done' }">
        <span class="md3-step-dot">
          <Check v-if="stateOf(s.key) === 'done'" />
          <template v-else>{{ s.num }}</template>
        </span>
        {{ s.label }}
      </li>
      <li v-if="i < steps.length - 1" class="md3-step-line" aria-hidden="true"></li>
    </template>
  </ol>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'

type StepKey = 'cart' | 'checkout' | 'payment'

const props = defineProps<{ current: StepKey; skipCart?: boolean }>()

const { t } = useI18n()

const labelOf = (key: StepKey) => {
  if (key === 'cart') return t('cart.title')
  if (key === 'checkout') return t('checkout.title')
  return t('payment.title')
}

const steps = computed(() => {
  const list: StepKey[] = props.skipCart ? ['checkout', 'payment'] : ['cart', 'checkout', 'payment']
  return list.map((key, idx) => ({ key, num: idx + 1, label: labelOf(key) }))
})

const currentIdx = computed(() => steps.value.findIndex((s) => s.key === props.current))

const stateOf = (key: StepKey): 'done' | 'on' | 'pending' => {
  const idx = steps.value.findIndex((s) => s.key === key)
  if (idx < currentIdx.value) return 'done'
  if (idx === currentIdx.value) return 'on'
  return 'pending'
}
</script>
