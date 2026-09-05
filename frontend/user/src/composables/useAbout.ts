import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'
import { usePageSeo } from './usePageSeo'

/**
 * 关于页共享逻辑（classic + vault 双模板共用）。
 * 完整保留原 views/About.vue 的行为，仅抽离为 composable。
 */
export function useAbout() {
  const { t, locale } = useI18n()
  const appStore = useAppStore()

  usePageSeo({
    title: () => t('nav.about'),
    canonicalPath: () => '/about',
  })

  const aboutConfig = computed(() => appStore.config?.about || null)
  const contactConfig = computed(() => appStore.config?.contact || null)

  const resolveLocalizedText = (raw: unknown): string => {
    if (!raw || typeof raw !== 'object') {
      return ''
    }

    const record = raw as Record<string, unknown>
    const lang = String(locale.value || appStore.locale || 'zh-CN')
    const candidates = [record[lang], record['zh-CN'], record['zh-TW'], record['en-US']]

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate.trim()
      }
    }

    return ''
  }

  const configuredServiceItems = computed(() => {
    const raw = aboutConfig.value?.services?.items
    if (!Array.isArray(raw)) {
      return []
    }

    return raw
      .map((item) => resolveLocalizedText(item))
      .filter((item) => item !== '')
  })

  // 后台一个字都没填时才用内置默认文案；填了任意一项就完全以后台为准，方便站长有意隐藏某个区块
  const aboutConfigured = computed(() => {
    const about = aboutConfig.value
    return (
      resolveLocalizedText(about?.hero?.title) !== '' ||
      resolveLocalizedText(about?.hero?.subtitle) !== '' ||
      resolveLocalizedText(about?.introduction) !== '' ||
      resolveLocalizedText(about?.services?.title) !== '' ||
      resolveLocalizedText(about?.contact?.title) !== '' ||
      resolveLocalizedText(about?.contact?.text) !== '' ||
      configuredServiceItems.value.length > 0
    )
  })
  const siteName = computed(() => String(appStore.config?.brand?.site_name || '').trim() || 'Store')
  const withDefault = (raw: unknown, fallback: () => string) =>
    aboutConfigured.value ? resolveLocalizedText(raw) : fallback()

  const heroTitle = computed(() => withDefault(aboutConfig.value?.hero?.title, () => t('about.title')))
  const heroSubtitle = computed(() =>
    withDefault(aboutConfig.value?.hero?.subtitle, () => t('about.subtitle', { site: siteName.value })),
  )
  const introductionText = computed(() =>
    withDefault(aboutConfig.value?.introduction, () => t('about.introduction', { site: siteName.value })),
  )
  const servicesTitle = computed(() => withDefault(aboutConfig.value?.services?.title, () => t('about.ourServices')))
  const contactTitle = computed(() => withDefault(aboutConfig.value?.contact?.title, () => t('about.contactUs')))
  const contactText = computed(() => withDefault(aboutConfig.value?.contact?.text, () => t('about.contactText')))

  const serviceItems = computed(() => {
    if (aboutConfigured.value) return configuredServiceItems.value
    return [1, 2, 3, 4].map((index) => t(`about.service${index}`))
  })

  const hasIntroduction = computed(() => introductionText.value !== '')
  const hasServices = computed(() => servicesTitle.value !== '' || serviceItems.value.length > 0)
  const hasContactLinks = computed(() => !!(contactConfig.value?.telegram || contactConfig.value?.whatsapp))
  const hasContact = computed(() => contactTitle.value !== '' || contactText.value !== '' || hasContactLinks.value)

  onMounted(async () => {
    if (!appStore.config) {
      await appStore.loadConfig()
    }
  })

  return {
    contactConfig,
    heroTitle,
    heroSubtitle,
    introductionText,
    servicesTitle,
    contactTitle,
    contactText,
    serviceItems,
    hasIntroduction,
    hasServices,
    hasContactLinks,
    hasContact,
  }
}
