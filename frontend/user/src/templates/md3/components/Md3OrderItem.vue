<template>
  <div class="flex flex-wrap justify-between gap-3.5 border-b border-[color:var(--md-sys-color-outline-variant)] py-3.5 first:pt-0 last:border-b-0 last:pb-0 max-[640px]:flex-col">
    <div class="flex min-w-0 flex-1 gap-3 max-[640px]:flex-none">
      <div class="grid h-[60px] w-[60px] flex-none place-items-center overflow-hidden rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container-high)]">
        <img v-if="orderItemImage(item)" :src="orderItemImage(item)" :alt="getLocalizedText(item.title)" loading="lazy" decoding="async" class="h-full w-full object-cover" />
        <ImageIcon v-else :stroke-width="1.5" class="h-[22px] w-[22px] text-[color:var(--md-sys-color-on-surface-variant)]" />
      </div>
      <div class="min-w-0">
        <div class="md3-title-s">{{ getLocalizedText(item.title) }}</div>
        <div class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.quantityLabel') }}：{{ item.quantity }}</div>
        <div v-if="orderItemSkuText(item)" class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.itemSkuLabel') }}：{{ orderItemSkuText(item) }}</div>
        <div class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.itemFulfillmentLabel') }}：{{ fulfillmentTypeLabelText(item.fulfillment_type) }}</div>
        <div v-if="item.tags && item.tags.length" class="mt-2 flex flex-wrap gap-1.5">
          <span v-for="(tag, index) in item.tags" :key="index" class="md3-badge md3-badge-neutral">{{ tag }}</span>
        </div>
        <div v-if="manualSubmissionRows(item.manual_form_submission, item.manual_form_schema_snapshot).length" class="md3-body-s mt-2.5 rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container)] px-3 py-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">
          <div class="mb-1.5 font-medium">{{ t('orderDetail.manualSubmissionTitle') }}</div>
          <div v-for="row in manualSubmissionRows(item.manual_form_submission, item.manual_form_schema_snapshot)" :key="row.key" class="mb-0.5 last:mb-0">
            <span class="font-medium text-[color:var(--md-sys-color-on-surface)]">{{ row.label }}</span>：{{ row.value }}
          </div>
        </div>
      </div>
    </div>
    <div class="md3-body-s grid min-w-[180px] content-start gap-0.5 text-right text-[color:var(--md-sys-color-on-surface-variant)] max-[640px]:min-w-0 max-[640px]:pl-[72px] max-[640px]:text-left">
      <div>{{ t('orderDetail.unitPriceLabel') }}：{{ formatMoney(item.original_unit_price, currency) }}</div>
      <div>{{ t('orderDetail.totalPriceLabel') }}：{{ formatMoney(item.original_total_price, currency) }}</div>
      <div v-if="hasDiscountAmount(item.coupon_discount_amount)" class="text-[color:var(--md-sys-color-error)]">{{ t('orderDetail.couponDiscountLabel') }}：{{ formatDiscountMoney(item.coupon_discount_amount, currency) }}</div>
      <div v-if="hasDiscountAmount(item.promotion_discount_amount)" class="text-[color:var(--md-sys-color-error)]">{{ t('orderDetail.promotionDiscountLabel') }}：{{ formatDiscountMoney(item.promotion_discount_amount, currency) }}</div>
      <div v-if="hasDiscountAmount(item.wholesale_discount_amount)" class="text-[color:var(--md-sys-color-error)]">{{ t('orderDetail.wholesaleDiscountLabel') }}：{{ formatDiscountMoney(item.wholesale_discount_amount, currency) }}</div>
      <div v-if="hasDiscountAmount(item.member_discount_amount)" class="text-[color:var(--md-sys-color-error)]">{{ t('orderDetail.memberDiscountLabel') }}：{{ formatDiscountMoney(item.member_discount_amount, currency) }}</div>
      <div v-if="hasItemDiscount(item)" class="font-medium text-[color:var(--md-sys-color-error)]">{{ t('orderDetail.itemDiscountTotalLabel') }}：{{ formatItemDiscountTotal(item, currency) }}</div>
      <div class="md3-label-l mt-0.5 text-[color:var(--md-sys-color-on-surface)]">{{ t('orderDetail.itemPaidAmountLabel') }}：{{ formatItemPaidAmount(item, currency) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Image as ImageIcon } from 'lucide-vue-next'
import { useOrderDisplayHelpers } from '../../../composables/useOrderDisplayHelpers'

defineProps<{ item: any; currency?: string }>()

const { t } = useI18n()

const {
  getLocalizedText, orderItemImage, orderItemSkuText, fulfillmentTypeLabelText, manualSubmissionRows,
  formatMoney, hasDiscountAmount, formatDiscountMoney, hasItemDiscount, formatItemDiscountTotal, formatItemPaidAmount,
} = useOrderDisplayHelpers(ref<any>(null))
</script>
