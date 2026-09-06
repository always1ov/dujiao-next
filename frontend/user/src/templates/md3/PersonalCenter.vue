<template>
  <div class="md3-container pb-10 pt-5 sm:pt-6">
    <!-- 账户头部 -->
    <header class="md3-card mb-5 flex flex-wrap items-center justify-between gap-4 px-6 py-6">
      <div class="flex min-w-0 items-center gap-4">
        <div class="md3-headline-s grid h-16 w-16 flex-none place-items-center rounded-full bg-[color:var(--md-sys-color-primary-container)] font-medium text-[color:var(--md-sys-color-on-primary-container)]">{{ displayInitial }}</div>
        <div class="min-w-0">
          <p class="md3-label-l text-[color:var(--md-sys-color-primary)]">{{ t('personalCenter.title') }}</p>
          <h1 class="md3-headline-s my-0.5 truncate">{{ userProfileStore.displayName }}</h1>
          <p class="md3-body-m truncate text-[color:var(--md-sys-color-on-surface-variant)]">{{ userProfileStore.profile?.email || t('personalCenter.subtitle') }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="md3-badge" :class="emailVerifiedVariant === 'success' ? 'md3-badge-success' : 'md3-badge-warning'">{{ emailVerifiedLabel }}</span>
        <span v-if="userProfileStore.currentLevel" class="md3-badge md3-badge-tertiary">
          <img v-if="isImagePath(userProfileStore.currentLevel?.icon)" :src="getImageUrl(userProfileStore.currentLevel!.icon)" class="h-3.5 w-3.5 object-contain" alt="" />
          <span v-else-if="userProfileStore.currentLevel?.icon">{{ userProfileStore.currentLevel.icon }}</span>
          <Crown v-else />
          {{ levelName(userProfileStore.currentLevel) }}
        </span>
      </div>
    </header>

    <div class="grid items-start gap-5 lg:grid-cols-[260px_1fr]">
      <!-- 侧栏：桌面导航抽屉 / 移动端横向 chips -->
      <aside class="min-w-0 lg:sticky lg:top-6">
        <nav class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:gap-0.5 lg:overflow-visible lg:rounded-[var(--md-shape-lg)] lg:bg-[color:var(--md-sys-color-surface-container-low)] lg:p-3 [&::-webkit-scrollbar]:hidden">
          <button
            v-for="item in visibleSectionItems"
            :key="item.key"
            type="button"
            class="md3-chip flex-none lg:hidden"
            :class="{ 'md3-chip-selected': currentSection === item.key }"
            @click="switchSection(item.key)"
          >
            <component :is="item.icon" />
            <span>{{ t(item.label) }}</span>
          </button>
          <button
            v-for="item in visibleSectionItems"
            :key="`d-${item.key}`"
            type="button"
            class="md3-list-item hidden min-h-[52px] py-0 text-left lg:flex"
            :class="{ 'is-active': currentSection === item.key }"
            @click="switchSection(item.key)"
          >
            <component :is="item.icon" />
            <span class="md3-label-l min-w-0 flex-1 truncate">{{ t(item.label) }}</span>
          </button>
        </nav>
      </aside>

      <!-- 内容 -->
      <section class="grid min-w-0 gap-4">
        <div v-if="globalAlert" class="md3-banner" :class="globalAlert.level === 'error' ? 'md3-banner-error' : (globalAlert.level === 'success' ? 'md3-banner-success' : 'md3-banner-warning')">
          <component :is="globalAlert.level === 'error' ? AlertCircle : (globalAlert.level === 'success' ? CheckCircle2 : AlertTriangle)" /> <span>{{ globalAlert.message }}</span>
        </div>

        <!-- 概览 -->
        <template v-if="currentSection === 'overview'">
          <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div class="md3-card-filled flex items-center gap-3 p-4">
              <div class="grid h-11 w-11 flex-none place-items-center rounded-full bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)]"><ShoppingBag class="h-5 w-5" /></div>
              <div class="min-w-0">
                <div class="md3-tile-label">{{ t('personalCenter.tabs.orders') }}</div>
                <div class="md3-title-l font-medium tabular-nums">{{ userProfileStore.loadingOrders ? '—' : userProfileStore.ordersTotal }}</div>
              </div>
            </div>
            <div class="md3-card-filled flex items-center gap-3 p-4">
              <div class="grid h-11 w-11 flex-none place-items-center rounded-full bg-[color:var(--md-sys-color-tertiary-container)] text-[color:var(--md-sys-color-on-tertiary-container)]"><Crown class="h-5 w-5" /></div>
              <div class="min-w-0">
                <div class="md3-tile-label">{{ t('personalCenter.memberLevel.currentLevel') }}</div>
                <div class="md3-title-m flex items-center gap-1.5 truncate">
                  <img v-if="isImagePath(userProfileStore.currentLevel?.icon)" :src="getImageUrl(userProfileStore.currentLevel!.icon)" class="h-3.5 w-3.5 object-contain" alt="" />
                  <span class="truncate">{{ levelName(userProfileStore.currentLevel) }}</span>
                </div>
              </div>
            </div>
            <div class="md3-card-filled flex items-center gap-3 p-4">
              <div class="grid h-11 w-11 flex-none place-items-center rounded-full bg-[color:var(--md-ext-warning-container)] text-[color:var(--md-ext-on-warning-container)]"><Percent class="h-5 w-5" /></div>
              <div class="min-w-0">
                <div class="md3-tile-label">{{ t('personalCenter.memberLevel.discountRate') }}</div>
                <div class="md3-title-l font-medium">{{ discountText }}</div>
              </div>
            </div>
            <div class="md3-card-filled flex items-center gap-3 p-4">
              <div class="grid h-11 w-11 flex-none place-items-center rounded-full bg-[color:var(--md-ext-success-container)] text-[color:var(--md-ext-on-success-container)]"><ShieldCheck class="h-5 w-5" /></div>
              <div class="min-w-0">
                <div class="md3-tile-label">{{ t('personalCenter.overview.accountLabel') }}</div>
                <div class="mt-1"><span class="md3-badge" :class="emailVerifiedVariant === 'success' ? 'md3-badge-success' : 'md3-badge-warning'">{{ emailVerifiedLabel }}</span></div>
              </div>
            </div>
          </div>

          <!-- 会员等级卡 -->
          <div v-if="userProfileStore.memberLevels.length > 0" class="md3-card-outlined p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="grid h-12 w-12 flex-none place-items-center rounded-full bg-[color:var(--md-sys-color-primary-container)] text-[22px]">
                  <img v-if="isImagePath(userProfileStore.currentLevel?.icon)" :src="getImageUrl(userProfileStore.currentLevel!.icon)" class="h-7 w-7 object-contain" alt="" />
                  <span v-else>{{ userProfileStore.currentLevel?.icon || '👤' }}</span>
                </div>
                <div>
                  <p class="md3-tile-label">{{ t('personalCenter.memberLevel.currentLevel') }}</p>
                  <p class="md3-title-m">{{ levelName(userProfileStore.currentLevel) }}</p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="md3-badge md3-badge-primary">
                  {{ t('personalCenter.memberLevel.discountRate') }}
                  {{ userProfileStore.currentLevel && userProfileStore.currentLevel.discount_rate < 100
                    ? t('personalCenter.memberLevel.discountOff', { n: userProfileStore.currentLevel.discount_rate / 10 })
                    : t('personalCenter.memberLevel.noDiscount') }}
                </span>
                <span v-if="!userProfileStore.nextLevel && userProfileStore.currentLevel" class="md3-badge md3-badge-success">{{ t('personalCenter.memberLevel.highestLevel') }}</span>
              </div>
            </div>

            <div v-if="userProfileStore.nextLevel" class="mt-4 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] p-4">
              <div class="flex items-center gap-3">
                <div class="grid h-10 w-10 flex-none place-items-center rounded-full bg-[color:var(--md-sys-color-surface-container-highest)] text-lg">
                  <img v-if="isImagePath(userProfileStore.nextLevel.icon)" :src="getImageUrl(userProfileStore.nextLevel.icon)" class="h-4 w-4 object-contain" alt="" />
                  <span v-else>{{ userProfileStore.nextLevel.icon || '⭐' }}</span>
                </div>
                <div>
                  <p class="md3-tile-label">{{ t('personalCenter.memberLevel.nextLevel') }}</p>
                  <div class="flex items-center gap-2">
                    <span class="md3-title-s">{{ levelName(userProfileStore.nextLevel) }}</span>
                    <span v-if="userProfileStore.nextLevel.discount_rate < 100" class="md3-label-m text-[color:var(--md-sys-color-primary)]">{{ t('personalCenter.memberLevel.discountOff', { n: userProfileStore.nextLevel.discount_rate / 10 }) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="userProfileStore.upgradeProgress" class="mt-3.5 grid gap-3">
                <div v-if="userProfileStore.upgradeProgress.rechargePercent !== null">
                  <div class="md3-body-s mb-1.5 flex justify-between text-[color:var(--md-sys-color-on-surface-variant)]">
                    <span>{{ t('personalCenter.memberLevel.rechargeProgress') }}</span>
                    <span class="tabular-nums">{{ userProfileStore.upgradeProgress.recharged.toFixed(2) }} / {{ userProfileStore.upgradeProgress.rechargeThreshold.toFixed(2) }}</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-[color:var(--md-sys-color-surface-container-highest)]"><div class="h-full rounded-full bg-[color:var(--md-sys-color-primary)] transition-[width] duration-700" :style="{ width: userProfileStore.upgradeProgress.rechargePercent + '%' }"></div></div>
                </div>
                <div v-if="userProfileStore.upgradeProgress.spendPercent !== null">
                  <div class="md3-body-s mb-1.5 flex justify-between text-[color:var(--md-sys-color-on-surface-variant)]">
                    <span>{{ t('personalCenter.memberLevel.spendProgress') }}</span>
                    <span class="tabular-nums">{{ userProfileStore.upgradeProgress.spent.toFixed(2) }} / {{ userProfileStore.upgradeProgress.spendThreshold.toFixed(2) }}</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-[color:var(--md-sys-color-surface-container-highest)]"><div class="h-full rounded-full bg-[color:var(--md-sys-color-primary)] transition-[width] duration-700" :style="{ width: userProfileStore.upgradeProgress.spendPercent + '%' }"></div></div>
                </div>
              </div>
            </div>
          </div>

          <!-- 最近订单 -->
          <div class="md3-card-outlined p-5">
            <div class="mb-4 flex items-center justify-between gap-3">
              <h3 class="md3-title-m">{{ t('personalCenter.overview.recentOrdersTitle') }}</h3>
              <RouterLink to="/me/orders" class="md3-btn md3-btn-text md3-btn-sm">{{ t('personalCenter.overview.viewAllOrders') }}</RouterLink>
            </div>
            <div v-if="userProfileStore.loadingOrders" class="grid gap-2.5">
              <div v-for="idx in 3" :key="idx" class="md3-skeleton h-16"></div>
            </div>
            <div v-else-if="userProfileStore.recentOrders.length === 0" class="md3-body-s rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] p-4 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('personalCenter.overview.emptyOrders') }}</div>
            <div v-else class="grid gap-2.5">
              <div v-for="order in userProfileStore.recentOrders" :key="order.order_no" class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container-low)] p-4">
                <div>
                  <div class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orders.orderNo') }}：{{ order.order_no }}</div>
                  <div class="md3-title-m my-0.5 tabular-nums">{{ formatMoney(order.total_amount, order.currency) }}</div>
                  <div class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatDate(order.created_at) }}</div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="md3-badge" :class="toneClass(statusVariant(order.status))">{{ statusLabel(order.status) }}</span>
                  <RouterLink :to="`/orders/${order.order_no}`" class="md3-btn md3-btn-outlined md3-btn-sm">{{ t('orders.viewDetails') }}</RouterLink>
                  <RouterLink v-if="order.status === 'pending_payment'" :to="`/pay?order_no=${order.order_no}`" class="md3-btn md3-btn-filled md3-btn-sm">{{ t('orders.payNow') }}</RouterLink>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 其余面板：复用现有组件（shadcn 风，靠 --ui-* 覆盖穿上 MD3 配色） -->
        <div v-else class="min-w-0">
          <ProfilePanel v-if="currentSection === 'profile'" />
          <SecurityPanel v-else-if="currentSection === 'security'" />
          <OrdersPanel v-else-if="currentSection === 'orders'" />
          <WalletPanel v-else-if="currentSection === 'wallet'" />
          <AffiliatePanel v-else-if="currentSection === 'affiliate'" />
          <div v-else-if="currentSection === 'reseller' && canAccessResellerConsole" class="md3-card-outlined p-5">
            <h2 class="md3-title-m">{{ t('resellerConsole.title') }}</h2>
            <p class="md3-body-m mt-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('resellerConsole.dashboard.description') }}</p>
            <RouterLink to="/reseller" class="md3-btn md3-btn-filled md3-btn-sm mt-4">{{ t('resellerConsole.nav.dashboard') }}</RouterLink>
          </div>
          <GiftCardPanel v-else-if="currentSection === 'giftCard'" />
          <ApiPanel v-else-if="currentSection === 'api'" />
          <OrdersPanel v-else />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, AlertTriangle, CheckCircle2, Crown, ShoppingBag, ShieldCheck, Percent } from 'lucide-vue-next'
import { getImageUrl } from '../../utils/image'
import ProfilePanel from '../../views/personal/ProfilePanel.vue'
import SecurityPanel from '../../views/personal/SecurityPanel.vue'
import OrdersPanel from '../../views/personal/OrdersPanel.vue'
import WalletPanel from '../../views/personal/WalletPanel.vue'
import GiftCardPanel from '../../views/personal/GiftCardPanel.vue'
import AffiliatePanel from '../../views/personal/AffiliatePanel.vue'
import ApiPanel from '../../views/personal/ApiPanel.vue'
import { usePersonalCenter, type PersonalSection } from '../../composables/usePersonalCenter'
import { toneClass } from './utils'

const { t } = useI18n()

const props = withDefaults(defineProps<{ section?: PersonalSection }>(), {
  section: 'overview',
})

const {
  userProfileStore, canAccessResellerConsole, visibleSectionItems, currentSection, globalAlert,
  displayInitial, switchSection, statusLabel, statusVariant, formatMoney, formatDate,
  emailVerifiedLabel, emailVerifiedVariant, discountText, isImagePath, levelName,
} = usePersonalCenter(() => props.section)
</script>
