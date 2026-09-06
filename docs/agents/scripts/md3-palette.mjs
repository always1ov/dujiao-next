// 用一个种子色重新生成 md3 模板的 Material 3 色彩令牌，原地改写 md3.css 里亮色与暗色两组 --md-sys-color-*。
//
// 用法（在装有 @material/material-color-utilities 的目录里执行，解析从当前目录找包）:
//   mkdir -p /tmp/palette && cd /tmp/palette && npm i @material/material-color-utilities@0.3.0
//   node <仓库>/docs/agents/scripts/md3-palette.mjs '#1a73e8' [<仓库>/frontend/user/src/templates/md3/styles/md3.css]
// 环境变量: MCU_MODULE=<模块路径> 指定包位置；MD3_VARIANT=vibrant|tonal-spot|expressive（默认 vibrant，电商用色更饱和；
//          tonal-spot 是 Material 默认的低饱和方案）。
//
// 只改 --md-sys-color-*；success / warning / info 扩展色和价格色是语义色，不随主色变，在 md3.css 里手改。
// 不要手改单个 --md-sys-color-* 值：tonal 方案保证对比度，单改一个会破坏配对。
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const seed = (process.argv[2] || '').trim()
if (!/^#[0-9a-fA-F]{6}$/.test(seed)) {
  console.error('用法: node md3-palette.mjs "#rrggbb" [md3.css 路径]')
  process.exit(1)
}
const here = path.dirname(new URL(import.meta.url).pathname)
const cssPath = process.argv[3] || path.resolve(here, '../../../frontend/user/src/templates/md3/styles/md3.css')

const resolveModule = () => {
  if (process.env.MCU_MODULE) return process.env.MCU_MODULE
  const req = createRequire(path.join(process.cwd(), '/'))
  return req.resolve('@material/material-color-utilities')
}
const mcu = await import(pathToFileURL(resolveModule()).href)
const { argbFromHex, hexFromArgb, SchemeTonalSpot, SchemeVibrant, SchemeExpressive, Hct, MaterialDynamicColors } = mcu
const variants = { 'tonal-spot': SchemeTonalSpot, vibrant: SchemeVibrant, expressive: SchemeExpressive }
const variantName = process.env.MD3_VARIANT || 'vibrant'
const Scheme = variants[variantName]
if (!Scheme) { console.error(`MD3_VARIANT 只能是 ${Object.keys(variants).join(' / ')}`); process.exit(1) }

const roles = [
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
  'surface', 'onSurface', 'surfaceVariant', 'onSurfaceVariant', 'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
  'outline', 'outlineVariant', 'inverseSurface', 'inverseOnSurface', 'inversePrimary', 'scrim', 'shadow',
]
const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())

const generate = (dark) => {
  const scheme = new Scheme(Hct.fromInt(argbFromHex(seed)), dark, 0)
  const out = {}
  for (const r of roles) {
    const dc = MaterialDynamicColors[r]
    if (dc) out[`--md-sys-color-${kebab(r)}`] = hexFromArgb(dc.getArgb(scheme))
  }
  return out
}

const applyTokens = (block, tokens) => {
  let changed = 0
  const next = block.replace(/(--md-sys-color-[a-z-]+):\s*#[0-9a-fA-F]{6};/g, (m, name) => {
    if (!tokens[name]) return m
    changed++
    return `${name}: ${tokens[name]};`
  })
  return { next, changed }
}

let css = fs.readFileSync(cssPath, 'utf8')
const lightHead = '.md3-scope,\nbody.md3-tokens {'
const darkHead = '.dark .md3-scope,\n.dark body.md3-tokens {'
const lightStart = css.indexOf(lightHead)
const darkStart = css.indexOf(darkHead)
if (lightStart < 0 || darkStart < 0 || darkStart < lightStart) {
  console.error('没找到 md3.css 的亮色 / 暗色令牌块，文件结构变了？')
  process.exit(1)
}
const darkEnd = css.indexOf('\n}\n', darkStart) + 3

const light = applyTokens(css.slice(lightStart, darkStart), generate(false))
const dark = applyTokens(css.slice(darkStart, darkEnd), generate(true))
css = css.slice(0, lightStart) + light.next + dark.next + css.slice(darkEnd)
// 头部注释里记下当前种子色，下次改色的人知道从哪来
css = css.replace(/以[^\n#]*(#[0-9a-fA-F]{6})([^\n]*)\n(\s*)为种子生成的[^\n]*/, `以 ${seed}（${variantName}）\n$3为种子生成的方案；success / warning / info 为扩展色，同样按 tonal palette 取值。`)
css = css.replace(/重新生成: [^\n]*/, '重新生成: docs/agents/scripts/md3-palette.mjs，不要手改单个色值，会破坏对比度。')
fs.writeFileSync(cssPath, css)
console.log(`种子 ${seed}（${variantName}）：亮色改了 ${light.changed} 个令牌，暗色改了 ${dark.changed} 个 → ${path.relative(process.cwd(), cssPath)}`)
