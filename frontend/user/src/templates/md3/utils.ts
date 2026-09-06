/**
 * md3 模板内部小工具：把 utils/status 的 BadgeTone / shadcn Badge variant
 * 映射到 md3.css 里的 .md3-badge-* 色彩角色。
 */
export const toneClass = (tone?: string | null): string => {
  switch (tone) {
    case 'success':
      return 'md3-badge-success'
    case 'warning':
      return 'md3-badge-warning'
    case 'info':
      return 'md3-badge-info'
    case 'accent':
    case 'default':
      return 'md3-badge-primary'
    case 'danger':
    case 'destructive':
      return 'md3-badge-error'
    default:
      return 'md3-badge-neutral'
  }
}

/** 封面占位色（无图时按索引轮换，取 MD3 容器色，保证与主题一致） */
export const coverToneClasses = [
  'bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)]',
  'bg-[color:var(--md-sys-color-tertiary-container)] text-[color:var(--md-sys-color-on-tertiary-container)]',
  'bg-[color:var(--md-sys-color-secondary-container)] text-[color:var(--md-sys-color-on-secondary-container)]',
  'bg-[color:var(--md-sys-color-surface-container-highest)] text-[color:var(--md-sys-color-on-surface-variant)]',
]
export const coverTone = (index: number) => coverToneClasses[Math.abs(index) % coverToneClasses.length]
