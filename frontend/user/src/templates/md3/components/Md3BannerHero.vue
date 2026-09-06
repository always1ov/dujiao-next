<template>
  <component :is="variant === 'card' ? 'div' : 'section'" v-if="showHeroSection" :class="variant === 'card' ? 'h-full' : 'md3-container pt-4 sm:pt-6'">
    <div
      class="relative overflow-hidden rounded-[var(--md-shape-xl)] bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)]"
      :class="variant === 'card' ? 'flex h-full min-h-[220px] flex-col' : ''"
      @touchstart="onBannerTouchStart"
      @touchend="onBannerTouchEnd"
    >
      <Transition name="md3-banner-fade" mode="out-in">
        <img
          v-if="!bannerLoading && heroImage"
          :src="heroImage"
          :key="heroImage"
          :alt="heroTitle"
          class="absolute inset-0 h-full w-full object-cover"
        />
      </Transition>
      <div v-if="heroImage" class="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/10"></div>

      <!-- 骨架 -->
      <div v-if="bannerLoading" class="relative flex min-h-[200px] flex-1 flex-col justify-end gap-3 p-6 sm:p-8" :class="variant === 'card' ? '' : 'sm:min-h-[260px] md:min-h-[320px] md:p-10'">
        <div class="md3-skeleton h-6 w-28 rounded-full"></div>
        <div class="md3-skeleton h-9 w-3/4 max-w-[520px]"></div>
        <div class="md3-skeleton h-4 w-1/2 max-w-[360px]"></div>
      </div>

      <!-- 内容 -->
      <div v-else class="relative flex min-h-[200px] flex-1 flex-col justify-between gap-4 p-6 sm:p-8" :class="[heroImage ? 'text-white' : '', variant === 'card' ? '' : 'sm:min-h-[260px] md:min-h-[320px] md:p-10']">
        <div v-if="bannerCount > 1" class="flex items-center justify-end gap-1">
          <button type="button" class="md3-icon-btn" :class="heroImage ? 'text-white' : ''" :aria-label="t('common.previousBanner')" @click="handlePrevHeroBanner"><ChevronLeft /></button>
          <button type="button" class="md3-icon-btn" :class="heroImage ? 'text-white' : ''" :aria-label="t('common.nextBanner')" @click="handleNextHeroBanner"><ChevronRight /></button>
        </div>

        <div class="mt-auto max-w-[640px] space-y-3">
          <span class="md3-badge" :class="heroImage ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-[color:var(--md-sys-color-surface)]/70 text-[color:var(--md-sys-color-primary)]'">
            <Zap /> {{ heroBadge }}
          </span>
          <h2 class="md3-headline-s sm:md3-headline-m font-medium" :class="heroImage ? 'text-white' : 'text-[color:var(--md-sys-color-on-primary-container)]'">{{ heroTitle }}</h2>
          <p class="md3-body-m sm:md3-body-l line-clamp-2 max-w-[52ch]" :class="heroImage ? 'text-white/85' : 'text-[color:var(--md-sys-color-on-primary-container)]/80'">{{ heroSubtitle }}</p>
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              class="md3-btn"
              :class="heroImage ? 'bg-white text-[#1b1b21] hover:shadow-[var(--md-elev-1)]' : 'md3-btn-filled'"
              @click="goToHeroLink"
            >
              {{ heroPrimaryButtonText }}
              <ArrowRight />
            </button>
          </div>
        </div>

        <div v-if="bannerCount > 1" class="flex items-center gap-1.5">
          <button
            v-for="(_, idx) in banners"
            :key="`md3-banner-dot-${idx}`"
            type="button"
            class="h-2 rounded-full transition-all"
            :class="[
              idx === currentBannerIndex ? 'w-6' : 'w-2 opacity-50 hover:opacity-80',
              heroImage ? 'bg-white' : 'bg-[color:var(--md-sys-color-primary)]',
            ]"
            :aria-label="t('common.switchBanner', { n: idx + 1 })"
            @click="selectHeroBanner(idx)"
          ></button>
        </div>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from 'lucide-vue-next'
import { useBannerCarousel } from '../../../composables/useBannerCarousel'

const props = withDefaults(defineProps<{ variant?: 'section' | 'card' }>(), { variant: 'section' })
const emit = defineEmits<{ loaded: [hasBanners: boolean] }>()
void props

const { t } = useI18n()

const {
  banners, bannerLoading, currentBannerIndex, bannerCount, showHeroSection,
  heroImage, heroBadge, heroTitle, heroSubtitle, heroPrimaryButtonText,
  loadBanners, handleNextHeroBanner, handlePrevHeroBanner, selectHeroBanner, goToHeroLink,
  onBannerTouchStart, onBannerTouchEnd, stopHeroAutoPlay,
} = useBannerCarousel()

onMounted(async () => {
  await loadBanners()
  emit('loaded', bannerCount.value > 0)
})
onUnmounted(() => stopHeroAutoPlay())
</script>

<style scoped>
.md3-banner-fade-enter-active,
.md3-banner-fade-leave-active { transition: opacity 300ms ease; }
.md3-banner-fade-enter-from,
.md3-banner-fade-leave-to { opacity: 0; }
</style>
