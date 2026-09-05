import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../stores/app'
import { usePageSeo } from './usePageSeo'
import { getLegalDefault } from '../content/legalDefaults'

/**
 * 条款/隐私页共享逻辑（classic + vault 双模板共用）。
 * 完整保留原 views/Legal.vue 的行为，仅抽离为 composable。
 * type 以 getter 传入以保持响应性（来源于组件 props）。
 */
export function useLegal(type: () => 'terms' | 'privacy') {
  const { t } = useI18n()
  const appStore = useAppStore()

  usePageSeo({
    title: () => type() === 'terms' ? t('footer.terms') : t('footer.privacy'),
    canonicalPath: () => type() === 'terms' ? '/terms' : '/privacy',
  })

  const loading = computed(() => appStore.loading)
  const locale = computed(() => appStore.locale)

  const title = computed(() => {
    return type() === 'terms' ? t('footer.terms') : t('footer.privacy')
  })

  const content = computed(() => {
    const config = appStore.config
    if (!config) return ''

    const legal = config.legal
    const lang = locale.value

    let custom = ''
    if (type() === 'terms' && legal?.terms) {
      custom = legal.terms[lang] || ''
    } else if (type() === 'privacy' && legal?.privacy) {
      custom = legal.privacy[lang] || ''
    }
    if (custom.trim() !== '') return custom

    // 后台没填时用内置默认文案，站点名取自站点设置
    const siteName = String(config?.brand?.site_name || '').trim() || 'Store'
    return getLegalDefault(type(), lang, siteName)
  })

  return {
    loading,
    title,
    content,
  }
}
