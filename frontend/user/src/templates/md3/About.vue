<template>
  <div class="mx-auto w-full max-w-[840px] px-4 pb-10 pt-4 sm:px-6">
    <header class="my-8 text-center">
      <h1 class="md3-headline-m sm:md3-headline-l mb-2.5">{{ heroTitle }}</h1>
      <p class="md3-body-l text-[color:var(--md-sys-color-on-surface-variant)]">{{ heroSubtitle }}</p>
    </header>

    <article class="md3-card p-6 sm:p-9">
      <div v-if="hasIntroduction" class="mb-9 last:mb-0">
        <p class="md3-body-l whitespace-pre-line leading-[1.8] text-[color:var(--md-sys-color-on-surface-variant)]">{{ introductionText }}</p>
      </div>

      <div v-if="hasServices" class="mb-9 last:mb-0">
        <h2 v-if="servicesTitle" class="md3-title-l mb-4 flex items-center gap-3">
          <span class="h-6 w-1.5 flex-none rounded-full bg-[color:var(--md-sys-color-primary)]"></span>{{ servicesTitle }}
        </h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="(service, index) in serviceItems" :key="`about-service-${index}`" class="flex items-start gap-3 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] px-4 py-3.5">
            <span class="grid h-6 w-6 flex-none place-items-center rounded-full bg-[color:var(--md-ext-success-container)] text-[color:var(--md-ext-on-success-container)]"><Check class="h-4 w-4" /></span>
            <span class="md3-body-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ service }}</span>
          </div>
        </div>
      </div>

      <div v-if="hasContact" class="mb-9 last:mb-0">
        <h2 v-if="contactTitle" class="md3-title-l mb-4 flex items-center gap-3">
          <span class="h-6 w-1.5 flex-none rounded-full bg-[color:var(--md-sys-color-primary)]"></span>{{ contactTitle }}
        </h2>
        <p v-if="contactText" class="md3-body-m mb-4 whitespace-pre-line leading-relaxed text-[color:var(--md-sys-color-on-surface-variant)]">{{ contactText }}</p>
        <div v-if="hasContactLinks" class="grid gap-3 sm:grid-cols-2">
          <a v-if="contactConfig?.telegram" :href="contactConfig.telegram" target="_blank" rel="noopener noreferrer" class="md3-btn md3-btn-tonal md3-btn-lg">
            <Send /> <span>Telegram</span>
          </a>
          <a v-if="contactConfig?.whatsapp" :href="contactConfig.whatsapp" target="_blank" rel="noopener noreferrer" class="md3-btn md3-btn-tonal md3-btn-lg">
            <MessageCircle /> <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { Check, MessageCircle, Send } from 'lucide-vue-next'
import { useAbout } from '../../composables/useAbout'

const {
  contactConfig, heroTitle, heroSubtitle, introductionText, servicesTitle, contactTitle, contactText,
  serviceItems, hasIntroduction, hasServices, hasContactLinks, hasContact,
} = useAbout()
</script>
