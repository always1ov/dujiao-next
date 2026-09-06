<template>
  <div class="flex flex-col items-center gap-3 rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-low)] px-6 py-14 text-center">
    <span class="grid h-16 w-16 place-items-center rounded-full bg-[color:var(--md-sys-color-secondary-container)] text-[color:var(--md-sys-color-on-secondary-container)]">
      <component :is="icon" class="h-8 w-8" />
    </span>
    <p class="md3-body-l text-[color:var(--md-sys-color-on-surface-variant)]">{{ message }}</p>
    <div v-if="$slots.default" class="mt-1 flex flex-wrap justify-center gap-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icon: Component; message: string }>()
</script>
