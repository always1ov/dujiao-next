<template>
  <div class="grid gap-2">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 v-if="title" class="md3-title-s">{{ title }}</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="isFulfillmentTruncated(fulfillment)"
          type="button"
          class="md3-btn md3-btn-outlined md3-btn-sm"
          :disabled="downloading"
          @click="emit('download', orderNo)"
        >
          <Download /> {{ downloading ? t('orderDetail.fulfillmentDownloading') : t('orderDetail.fulfillmentDownload') }}
        </button>
        <button
          v-if="fulfillment.status === 'delivered' && !isFulfillmentTruncated(fulfillment)"
          type="button"
          class="md3-btn md3-btn-sm"
          :class="fulfillmentCopied ? 'md3-btn-filled' : 'md3-btn-tonal'"
          @click="handleCopyFulfillment(fulfillment)"
        >
          <component :is="fulfillmentCopied ? Check : Copy" /> {{ fulfillmentCopied ? t('orderDetail.fulfillmentCopied') : t('orderDetail.fulfillmentCopy') }}
        </button>
      </div>
    </div>

    <div class="md3-kv"><span>{{ t('orderDetail.fulfillmentType') }}</span><span>{{ fulfillmentTypeLabelText(fulfillment.type) }}</span></div>
    <div class="md3-kv"><span>{{ t('orderDetail.fulfillmentStatus') }}</span><span>{{ fulfillmentStatusLabelText(fulfillment.status) }}</span></div>

    <template v-if="isFulfillmentTruncated(fulfillment)">
      <div class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.fulfillmentTotalLines', { count: fulfillment.payload_line_count }) }}</div>
      <div class="md3-banner md3-banner-warning"><AlertTriangle /> <span>{{ t('orderDetail.fulfillmentTruncatedHint') }}</span></div>
      <pre class="mt-1 max-h-[260px] overflow-y-auto whitespace-pre-wrap break-all rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container)] p-3 font-mono text-[12.5px] text-[color:var(--md-sys-color-on-surface-variant)]">{{ fulfillment.payload }}</pre>
    </template>
    <div v-else-if="fulfillmentDeliveryLines(fulfillment).length" class="mt-1 grid gap-0.5 rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container)] p-3 font-mono text-[12.5px] text-[color:var(--md-sys-color-on-surface-variant)]">
      <div v-for="(line, index) in fulfillmentDeliveryLines(fulfillment)" :key="index" class="whitespace-pre-wrap break-all">{{ line }}</div>
    </div>
    <pre v-else class="mt-1 whitespace-pre-wrap break-all rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container)] p-3 font-mono text-[12.5px] text-[color:var(--md-sys-color-on-surface-variant)]">{{ fulfillment.payload }}</pre>

    <div v-if="fulfillment.status === 'delivered' && instructionBlocks(items).length" class="mt-1.5 grid gap-2.5">
      <div v-for="(block, bi) in instructionBlocks(items)" :key="bi" class="rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-primary-container)] p-3.5 text-[color:var(--md-sys-color-on-primary-container)]">
        <div class="md3-label-l mb-2 flex items-center gap-2"><Info class="h-4 w-4" /> {{ t('orderDetail.instructionsTitle') }}</div>
        <div class="prose prose-sm max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-sm" v-html="block.html"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, Copy, Check, Download, Info } from 'lucide-vue-next'
import { useOrderDisplayHelpers } from '../../../composables/useOrderDisplayHelpers'

defineProps<{
  title?: string
  fulfillment: any
  items?: any[]
  orderNo: string
  downloading: boolean
}>()

const emit = defineEmits<{ (e: 'download', orderNo: string): void }>()

const { t } = useI18n()

const {
  isFulfillmentTruncated, fulfillmentDeliveryLines, instructionBlocks,
  fulfillmentTypeLabelText, fulfillmentStatusLabelText, fulfillmentCopied, handleCopyFulfillment,
} = useOrderDisplayHelpers(ref<any>(null))
</script>
