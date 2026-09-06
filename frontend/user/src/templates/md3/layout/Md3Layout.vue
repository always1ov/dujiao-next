<template>
  <div class="md3-scope">
    <!-- 顶部应用栏 -->
    <header class="md3-top-bar" :class="{ 'is-scrolled': scrolled }">
      <div class="md3-container flex h-16 items-center gap-2">
        <RouterLink class="md3-title-l inline-flex min-w-0 items-center gap-2.5 font-medium" to="/" :title="brandName">
          <img v-if="brandLogo" :src="brandLogo" :alt="brandName" class="h-8 max-w-[120px] object-contain sm:max-w-[160px]" />
          <span v-else class="truncate">{{ brandName }}</span>
        </RouterLink>

        <nav class="ml-3 hidden items-center gap-1 lg:flex" :aria-label="t('nav.home')">
          <template v-for="item in menuItems" :key="item.key">
            <RouterLink
              v-if="item.type === 'route'"
              :to="item.path"
              class="md3-top-link"
              active-class="is-active"
            >{{ item.label }}</RouterLink>
            <a v-else :href="item.path" :target="item.target" rel="noopener noreferrer" class="md3-top-link">{{ item.label }}</a>
          </template>
        </nav>

        <div class="ml-auto flex items-center gap-0.5 sm:gap-1">
          <RouterLink class="md3-icon-btn" to="/products" :aria-label="t('nav.products')" :title="t('nav.products')"><Search /></RouterLink>
          <RouterLink v-if="!userAuthStore.isAuthenticated" class="md3-icon-btn hidden lg:inline-grid" to="/guest/orders" :aria-label="t('navbar.guestOrders')" :title="t('navbar.guestOrders')"><ClipboardList /></RouterLink>
          <button class="md3-icon-btn" type="button" :aria-label="t('resellerConsole.common.toggleTheme')" @click="toggleTheme">
            <Sun v-if="theme === 'dark'" />
            <Moon v-else />
          </button>
          <RouterLink class="md3-icon-btn relative hidden lg:inline-grid" to="/cart" :aria-label="t('navbar.cart')">
            <ShoppingCart />
            <span v-if="cartCount > 0" class="md3-nav-count -top-0 right-0">{{ cartCount > 99 ? '99+' : cartCount }}</span>
          </RouterLink>

          <!-- 语言 -->
          <div class="relative hidden lg:block" ref="langEl">
            <button class="md3-icon-btn" type="button" :aria-label="t('navbar.selectLanguage')" @click="toggleLang"><Languages /></button>
            <div v-if="langOpen" class="md3-menu absolute right-0 top-[calc(100%+8px)] z-[60]">
              <div class="md3-label-m px-3 pb-1 pt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('navbar.selectLanguage') }}</div>
              <button v-for="lang in languages" :key="lang.code" type="button" class="md3-menu-item" :class="{ 'is-active': appStore.locale === lang.code }" @click="changeLanguage(lang.code)">
                <Check v-if="appStore.locale === lang.code" />
                <span v-else class="w-5"></span>
                {{ lang.name }}
              </button>
            </div>
          </div>

          <!-- 登录 / 个人中心 / 退出（桌面） -->
          <template v-if="userAuthStore.isAuthenticated">
            <RouterLink class="md3-btn md3-btn-tonal md3-btn-sm ml-1 hidden lg:inline-flex" to="/me"><User /> {{ t('navbar.personalCenter') }}</RouterLink>
            <button type="button" class="md3-icon-btn hidden lg:inline-grid" :aria-label="t('navbar.logout')" :title="t('navbar.logout')" @click="userAuthStore.logout()"><LogOut /></button>
          </template>
          <RouterLink v-else-if="personalCenterEnabled" class="md3-btn md3-btn-filled md3-btn-sm ml-1 hidden lg:inline-flex" to="/auth/login">{{ t('navbar.login') }}</RouterLink>

          <!-- 移动端：更多 -->
          <div class="relative lg:hidden" ref="moreEl">
            <button class="md3-icon-btn" type="button" :aria-label="t('navbar.more')" :aria-expanded="moreOpen" @click="toggleMore">
              <MoreVertical v-if="!moreOpen" />
              <X v-else />
            </button>
            <div v-if="moreOpen" class="md3-menu absolute right-0 top-[calc(100%+8px)] z-[60] max-h-[70vh] overflow-y-auto">
              <template v-for="item in menuItems" :key="`m-${item.key}`">
                <RouterLink v-if="item.type === 'route'" :to="item.path" class="md3-menu-item" @click="moreOpen = false"><component :is="item.icon" /> {{ item.label }}</RouterLink>
                <a v-else :href="item.path" :target="item.target" rel="noopener noreferrer" class="md3-menu-item" @click="moreOpen = false"><component :is="item.icon" /> {{ item.label }}</a>
              </template>
              <RouterLink v-if="!userAuthStore.isAuthenticated" to="/guest/orders" class="md3-menu-item" @click="moreOpen = false"><ClipboardList /> {{ t('navbar.guestOrders') }}</RouterLink>
              <RouterLink v-if="userAuthStore.isAuthenticated" to="/me" class="md3-menu-item" @click="moreOpen = false"><User /> {{ t('navbar.personalCenter') }}</RouterLink>
              <RouterLink v-else-if="personalCenterEnabled" to="/auth/login" class="md3-menu-item" @click="moreOpen = false"><User /> {{ t('navbar.login') }}</RouterLink>
              <button v-if="userAuthStore.isAuthenticated" type="button" class="md3-menu-item" @click="userAuthStore.logout(); moreOpen = false"><LogOut /> {{ t('navbar.logout') }}</button>
              <div class="md3-divider my-2"></div>
              <div class="md3-label-m px-3 pb-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('navbar.selectLanguage') }}</div>
              <button v-for="lang in languages" :key="`ml-${lang.code}`" type="button" class="md3-menu-item" :class="{ 'is-active': appStore.locale === lang.code }" @click="changeLanguage(lang.code); moreOpen = false">
                <Check v-if="appStore.locale === lang.code" />
                <span v-else class="w-5"></span>
                {{ lang.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 页面内容（移动端给底部导航栏留出空间） -->
    <main class="flex-1 pb-[calc(88px+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="mt-12 bg-[color:var(--md-sys-color-surface-container-low)] lg:rounded-t-[var(--md-shape-xl)]">
      <div class="md3-container grid grid-cols-1 gap-8 pb-8 pt-12 sm:grid-cols-2 lg:grid-cols-[1.7fr_repeat(3,1fr)]">
        <div>
          <RouterLink class="md3-title-l inline-flex items-center gap-2.5 font-medium" to="/">
            <img v-if="brandLogo" :src="brandLogo" :alt="brandName" class="h-8 max-w-[160px] object-contain" />
            <span v-else>{{ brandName }}</span>
          </RouterLink>
          <p class="md3-body-m mt-3 max-w-[38ch] text-[color:var(--md-sys-color-on-surface-variant)]">{{ brandDescription || t('vault.footer.tagline') }}</p>
        </div>
        <div>
          <h4 class="md3-title-s mb-3">{{ t('vault.footer.shop') }}</h4>
          <RouterLink v-if="!isListMode" to="/products" class="md3-footer-link">{{ t('products.allCategories') }}</RouterLink>
          <RouterLink v-if="noticeEnabled" to="/notice" class="md3-footer-link">{{ t('nav.notice') }}</RouterLink>
          <RouterLink v-if="blogEnabled" to="/blog" class="md3-footer-link">{{ t('nav.blog') }}</RouterLink>
          <RouterLink v-if="personalCenterEnabled || userAuthStore.isAuthenticated" to="/me" class="md3-footer-link">{{ t('navbar.personalCenter') }}</RouterLink>
        </div>
        <div>
          <h4 class="md3-title-s mb-3">{{ t('vault.footer.support') }}</h4>
          <RouterLink v-if="aboutEnabled" to="/about" class="md3-footer-link"><Info class="h-4 w-4" /> {{ t('nav.about') }}</RouterLink>
          <RouterLink v-if="!userAuthStore.isAuthenticated" to="/guest/orders" class="md3-footer-link"><ClipboardList class="h-4 w-4" /> {{ t('navbar.guestOrders') }}</RouterLink>
          <a v-if="contact?.telegram" :href="contact.telegram" target="_blank" rel="noopener noreferrer" class="md3-footer-link"><Send class="h-4 w-4" /> Telegram</a>
          <a v-if="contact?.whatsapp" :href="contact.whatsapp" target="_blank" rel="noopener noreferrer" class="md3-footer-link"><MessageCircle class="h-4 w-4" /> WhatsApp</a>
        </div>
        <div>
          <h4 class="md3-title-s mb-3">{{ t('vault.footer.legal') }}</h4>
          <RouterLink to="/terms" class="md3-footer-link">{{ t('footer.terms') }}</RouterLink>
          <RouterLink to="/privacy" class="md3-footer-link">{{ t('footer.privacy') }}</RouterLink>
          <a v-for="link in footerLinks" :key="link.name" :href="link.url || 'javascript:void(0)'" :target="link.url ? '_blank' : undefined" rel="noopener noreferrer" class="md3-footer-link">{{ link.name }}</a>
        </div>
      </div>
      <div class="md3-container md3-body-s flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--md-sys-color-outline-variant)] pb-8 pt-4 text-[color:var(--md-sys-color-on-surface-variant)]">
        <span>© {{ year }} {{ brandName }}</span>
        <span>简体中文 · 繁體 · English</span>
      </div>
    </footer>

    <!-- 底部导航栏（移动端 / 平板） -->
    <nav class="md3-nav-bar lg:hidden" :aria-label="t('nav.home')">
      <RouterLink to="/" class="md3-nav-item" :class="{ 'is-active': isActive('home') }">
        <span class="md3-nav-indicator"><Home /></span>
        <span>{{ t('nav.home') }}</span>
      </RouterLink>
      <RouterLink v-if="!isListMode" to="/products" class="md3-nav-item" :class="{ 'is-active': isActive('products') }">
        <span class="md3-nav-indicator"><LayoutGrid /></span>
        <span>{{ t('nav.products') }}</span>
      </RouterLink>
      <RouterLink to="/cart" class="md3-nav-item" :class="{ 'is-active': isActive('cart') }">
        <span class="md3-nav-indicator">
          <ShoppingCart />
          <span v-if="cartCount > 0" class="md3-nav-count">{{ cartCount > 99 ? '99+' : cartCount }}</span>
        </span>
        <span>{{ t('navbar.cart') }}</span>
      </RouterLink>
      <RouterLink v-if="!userAuthStore.isAuthenticated && !personalCenterEnabled" to="/guest/orders" class="md3-nav-item" :class="{ 'is-active': isActive('guest') }">
        <span class="md3-nav-indicator"><ClipboardList /></span>
        <span>{{ t('navbar.guestOrders') }}</span>
      </RouterLink>
      <RouterLink v-if="userAuthStore.isAuthenticated" to="/me" class="md3-nav-item" :class="{ 'is-active': isActive('me') }">
        <span class="md3-nav-indicator"><User /></span>
        <span>{{ t('navbar.personalCenter') }}</span>
      </RouterLink>
      <RouterLink v-else-if="personalCenterEnabled" to="/auth/login" class="md3-nav-item" :class="{ 'is-active': isActive('auth') }">
        <span class="md3-nav-indicator"><User /></span>
        <span>{{ t('navbar.login') }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Search, Moon, Sun, ShoppingCart, Languages, MoreVertical, X, User, Info, ClipboardList, LogOut,
  LayoutGrid, Send, MessageCircle, Home, Check,
} from 'lucide-vue-next'
import { useAppStore } from '../../../stores/app'
import { useCartStore } from '../../../stores/cart'
import { useUserAuthStore } from '../../../stores/userAuth'
import { useNavConfig, type NavItem } from '../../../composables/useNavConfig'
import { useTheme } from '../../../utils/theme'
import { getImageUrl } from '../../../utils/image'
import { getLocalizedText } from '../../../utils/resellerSiteConfig'
// 本地自托管 Roboto（MD3 默认字体），仅 md3 模板加载；中文回退到系统字体栈
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import '../styles/md3.css'

const { t } = useI18n()
const route = useRoute()
const appStore = useAppStore()
const cartStore = useCartStore()
const userAuthStore = useUserAuthStore()
const { theme, toggleTheme } = useTheme()

const langOpen = ref(false)
const moreOpen = ref(false)
const langEl = ref<HTMLElement | null>(null)
const moreEl = ref<HTMLElement | null>(null)
const scrolled = ref(false)

const year = new Date().getFullYear()

const brandName = computed(() => String(appStore.config?.brand?.site_name || '').trim() || 'Store')
const brandLogo = computed(() => {
  const raw = String(appStore.config?.brand?.site_logo || '').trim()
  return raw ? getImageUrl(raw) : ''
})
const brandDescription = computed(() => {
  const desc = appStore.config?.brand?.site_description
  if (desc && typeof desc === 'object') {
    const val = (desc as Record<string, string>)[appStore.locale] || (desc as Record<string, string>)['zh-CN'] || ''
    return typeof val === 'string' ? val.trim() : ''
  }
  return ''
})

const { isListMode, blogEnabled, noticeEnabled, aboutEnabled, personalCenterEnabled, secondaryNavItems } = useNavConfig()

const menuItems = computed<NavItem[]>(() => {
  const items: NavItem[] = []
  if (!isListMode.value) {
    items.push({ key: 'products', path: '/products', label: t('products.allCategories'), icon: LayoutGrid, type: 'route', target: '_self' })
  }
  items.push(...secondaryNavItems.value)
  return items
})

const footerLinks = computed(() => {
  const links = appStore.config?.footer_links
  if (!Array.isArray(links)) return []
  return links
    .map((item: { name?: unknown; url?: unknown }) => ({
      name: typeof item?.name === 'string' ? item.name.trim() : getLocalizedText(item?.name as Record<string, string>, appStore.locale),
      url: String(item?.url || '').trim(),
    }))
    .filter((item) => item.name)
})

const contact = computed(() => appStore.config?.contact as { telegram?: string; whatsapp?: string } | undefined)
const cartCount = computed(() => cartStore.totalItems)

const languages = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en-US', name: 'English' },
]

const changeLanguage = (code: string) => {
  appStore.setLocale(code)
  langOpen.value = false
}

const toggleLang = () => { langOpen.value = !langOpen.value; moreOpen.value = false }
const toggleMore = () => { moreOpen.value = !moreOpen.value; langOpen.value = false }

/** 底部导航栏高亮：按路径前缀判断 */
const isActive = (key: 'home' | 'products' | 'cart' | 'guest' | 'me' | 'auth') => {
  const p = route.path
  switch (key) {
    case 'home': return p === '/'
    case 'products': return p.startsWith('/products') || p.startsWith('/categories')
    case 'cart': return p.startsWith('/cart') || p.startsWith('/checkout')
    case 'guest': return p.startsWith('/guest')
    case 'me': return p.startsWith('/me') || p.startsWith('/orders')
    case 'auth': return p.startsWith('/auth')
  }
}

const onDocClick = (e: MouseEvent) => {
  const target = e.target as Node
  if (langOpen.value && langEl.value && !langEl.value.contains(target)) langOpen.value = false
  if (moreOpen.value && moreEl.value && !moreEl.value.contains(target)) moreOpen.value = false
}
const onScroll = () => { scrolled.value = window.scrollY > 8 }

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  // Teleport 到 body 的浮层（Toast / ConfirmDialog / 公告弹窗 / Select 下拉）在
  // .md3-scope 之外，靠 body 上的这个 class 拿到 MD3 配色，详见 styles/md3.css
  document.body.classList.add('md3-tokens')
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', onScroll)
  document.body.classList.remove('md3-tokens')
})
</script>

<style scoped>
.md3-footer-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--md-sys-color-on-surface-variant);
  transition: color var(--md-duration-short);
}
.md3-footer-link:hover { color: var(--md-sys-color-primary); }
</style>
