# CUSTOM.md · 相对上游的改动记录

本分支 `custom` 是在上游 `dujiao-next/dujiao-next` 的 `main` 之上放自己改动的地方。
`main` 永远只快进同步上游，一行不改；所有自己的修改都提交到这里。

## 分支布局

| 分支 | 作用 | 规则 |
| --- | --- | --- |
| `main` | 上游镜像 | 只 `--ff-only` 同步上游，不在上面提交 |
| `custom` | 自己改过的代码 | 从 `main` 分出；上游更新后把 `main` 合并进来 |
| `deploy` | Dokploy 部署 | 孤儿分支，只有 `docker-compose.yml`、`env.example`、`README.md` |

## 当前改动清单

| 日期 | 改了什么 | 为什么 | 涉及文件 | 提交 |
| --- | --- | --- | --- | --- |
| 2026-09-05 | 去除访客可见的上游品牌痕迹（详见下节） | 不让访客看出所用框架 | 前台、后台、Go 共 34 个文件 | `f7273e4` |
| 2026-09-05 | 服务条款、隐私政策、关于页、页脚与首页的内置默认文案（虚拟商品不支持售后） | 后台留空也有像样的内容 | `frontend/user/src/content/legalDefaults.ts`、`useLegal.ts`、`useAbout.ts`、三个 locale JSON | `2ef2b3e`、`8a6aaba` |
| 2026-09-05 | 导航配置新增「个人中心」开关，关闭后未登录访客看不到页脚和手机底栏的入口 | 游客店不想引导注册 | `site_normalize.go`、`SettingsNavigationTab.vue`、`useNavConfig.ts`、`VaultLayout.vue`、`MobileBottomNav.vue` | `edd2e47` |
| 2026-09-06 | 「账户入口」开关同时隐藏顶栏登录按钮（classic、vault） | 与个人中心一起收口 | `Navbar.vue`、`VaultLayout.vue`、后台文案 | `4ab478b` |
| 2026-09-06 | 新增第三套店面模板 `md3`（Material Design 3）：全部前台页面按 MD3 重做，纯新增文件不改上游页面；后台同步换 MD3 令牌 | 想要 MD3 风格的 UI，又不能破坏上游同步 | `frontend/user/src/templates/md3/**`、`registry.ts`、`App.vue`、后台 `Settings.vue` + i18n、`constants.go`、`site_normalize.go`、后台 `style.css` 与 `components/ui/*` | 见 git log |
| 2026-09-06 | 按 mattpocock/skills 的 code-review + improve-codebase-architecture 过一遍：md3 首页改走 `useNavConfig`，商品卡/列表项共用逻辑抽成 `useProductCard.ts`，Go 侧补店面模板与导航开关归一化的表驱动测试 | 评审发现的接缝泄漏与重复；归一化此前无测试 | `templates/md3/Home.vue`、`templates/md3/useProductCard.ts`、`components/Md3Product*.vue`、`site_normalize_template_test.go` | 见 git log |
| 2026-09-06 | 把 AI 协作流程固化进仓库：AGENTS.md（CLAUDE.md 符号链接）、CONTEXT.md 词汇表、docs/adr 五条决定、docs/agents 三份配置、mattpocock/skills 25 个 skill 装到 .agents/skills，`.scratch/rebrand/` 开始自建品牌的 grilling | 让任何 AI 下次都能直接接手 | `AGENTS.md`、`CONTEXT.md`、`docs/`、`.agents/`、`.claude/`、`.scratch/`、`.gitignore` | 见 git log |
| 2026-09-06 | md3 模板六个页面重排信息架构（首页搜索优先 + 按分类分组、列表页顶部工具栏与网格/列表切换、详情页摘要条 + 分页签 + 吸顶购买卡、购物车/结算/支付单列 + 吸底操作条、游客查单居中卡），新增 `md3.*` 三语文案 | 页面组织不再逐页照搬上游，熟悉上游的人认不出 | `templates/md3/{Home,Products,ProductDetail,Cart,Checkout,Payment,GuestOrders}.vue`、`Md3BannerHero.vue`、三个 locale JSON、`.scratch/relayout/` | 见 git log |
| 2026-09-06 | md3 外壳改成 Material 3 大屏布局：桌面左侧导航栏（无顶栏）、手机搜索式应用栏、单行页脚 | 店主要求头部、中间、底部全都变 | `templates/md3/layout/Md3Layout.vue`、`styles/md3.css`、四个页面的吸顶偏移 | 见 git log |
| 2026-09-06 | md3 商城化：电商三段式头部（工具条 / 品牌+搜索+购物车 / 分类导航条）+ 四栏页脚，首页三栏首屏 + 热门与分类分区，列表页左侧分类树，详情两栏 + 同类推荐，购物车表格 + 结算卡，结算左表单右摘要，商品卡改电商样式（暖红价格色）；顺手修了下拉一点即关、手机菜单、手机搜索框、手机购买条四个问题；新增全量点击测试脚本与演示数据脚本 | 店主要「像样子的商城」并测试所有能点的功能（桌面 60/60、手机 53/53 通过） | `templates/md3/**`、`styles/md3.css` 第 8 节、三个 locale JSON 的 `md3.*`、`docs/agents/scripts/`、`docs/agents/smoke-test.md`、`.scratch/relayout/issues/09、10` | 见 git log |
| 2026-09-06 | md3 配色从紫色换成蓝色（种子 #1a73e8，vibrant），品牌处不再显示首字母方块（有 logo 显示 logo，没有只显示店名），页脚「购物指南」不再列商品分类；新增 `md3-palette.mjs` 一条命令换主色 | 店主看过线上效果后的三点反馈 | `styles/md3.css` 令牌块、`layout/Md3Layout.vue`、`docs/agents/scripts/md3-palette.mjs`、`docs/agents/smoke-test.md` | 见 git log |
| 2026-09-06 | md3 桌面顶部改回单行导航：品牌 + 导航链接（首页、商品中心、前 5 个一级分类、「更多分类」下拉、博客/公告/关于/自定义）+ 紧凑搜索框 + 订单/购物车/深浅色/语言图标 + 登录按钮；去掉工具条与「全部分类」大按钮那排 | 店主：页面内容很完美，顶部要像以前或像博客那样的导航 | `layout/Md3Layout.vue`、`styles/md3.css` 第 9 节、四处吸顶偏移、点击测试脚本 | 见 git log |
| 2026-09-06 | md3 首页：后台没配横幅时不再显示「马上选购」兜底卡（首屏只剩最新公告 / 怎么买，横排铺满）；列表模式去掉列表上方的搜索框（顶栏搜索已能驱动本页筛选） | 店主：不需要马上选购和搜索这一块 | `templates/md3/Home.vue` | 见 git log |

## 给 AI 的协作流程

从 `AGENTS.md` 开始读（`CLAUDE.md` 是它的符号链接）。词汇在 `CONTEXT.md`，决定在 `docs/adr/`，进行中的工作在 `.scratch/`。
skill 来自 [mattpocock/skills](https://github.com/mattpocock/skills)，装在 `.agents/skills/`，`npx skills update` 升级。
本地冒烟与截图步骤见 `docs/agents/smoke-test.md`。

## md3 模板（Material Design 3）

- 位置：`frontend/user/src/templates/md3/`。与 `vault` 同一套机制：`registry.ts` 里 `templateView()` 按当前模板找同名页面，找不到就回退 classic，所以上游新增页面不会白屏，只是那一页先用 classic 样式。
- 启用：后台 → 站点设置 → 店面模板 → 选「Material 3」。临时预览：任意地址加 `?template=md3`。
- 设计令牌在 `styles/md3.css`：色彩角色由 `@material/material-color-utilities` 以靛蓝 `#4f46e5` 为种子生成（亮/暗两套），不要手改单个色值；改种子色时重新生成整份。同一个文件把 shadcn 的 `--ui-*` 覆盖成 MD3 色，所以公用组件（Toast、弹窗、下拉、二维码支付页的公共组件）自动跟着换色。
- 组件类命名 `.md3-btn-*`、`.md3-card*`、`.md3-chip`、`.md3-badge-*`、`.md3-banner-*`、`.md3-input`、`.md3-nav-bar` 等，页面只用这些类 + Tailwind utility，业务逻辑全部复用 `composables/`，不复制任何逻辑。
- 后台换肤只改了 `frontend/admin/src/style.css`（HSL 令牌、圆角、字体）和 `components/ui/` 里按钮/卡片/输入框/标签页/弹窗几个基础件的 class，页面文件没动，方便同步上游。
- 字体：Roboto 通过 `@fontsource/roboto` 本地打包，不走 Google Fonts；中文回退系统字体栈。

## 去品牌改动说明

访客能看到的地方，全部换成中性文字或删除：

- 前台页脚（classic、vault 两套模板）：删掉指向上游 GitHub 的链接和名字
- 前台站点名兜底：`Dujiao-Next` → `Store`。后台「站点设置」填了站点名后不会用到兜底
- 前台 i18n 默认文案（三种语言）：首页 hero 标题、关于我们副标题与简介、`common.siteName`
- 浏览器控制台的品牌横幅与版本号打印：删除
- 默认图标：`/dj.svg` → `/favicon.svg`（中性购物袋图标；后台上传站点图标后会替换）
- localStorage 主题键 `dujiao_theme` → `site_theme`；Telegram 登录的全局回调名去掉前缀
- 公开配置接口 `/api/v1/public/config`：不再下发 `app_version`；默认联系方式（上游 Telegram 群、假 WhatsApp）改为空
- 新增后台接口 `GET /api/v1/admin/system/version`（所有管理员可读），后台页脚版本号改从这里取
- 后台登录页与侧边栏页脚：删掉上游名字和 GitHub 链接；后台标题与品牌文案改为「管理后台」/ `Admin`
- 2FA 发行方默认值（管理员和顾客的验证器里显示的名字）：`Store`。正式部署用 `APP_TOTP_ISSUER` 环境变量填自己的名字
- SMTP 测试邮件正文与 MIME boundary 去掉上游名字
- 2FA 恢复码下载文件名去掉前缀

保留、未改（改了会影响功能，或属于第三方名称）：

- 对接协议用的请求头 `Dujiao-Next-Api-Key`、`Dujiao-Next-Channel-*` 与站点对接协议名 `dujiao-next`：其他店铺和 Bot 靠这些对接
- 支付渠道 `DujiaoPay`：第三方支付产品名，只在后台配置页出现
- 后台首次登录的合规声明（GPL v3 说明）与仓库 `LICENSE`
- 后台的 Telegram Bot 授权购买链接、版本更新检查（访问上游 GitHub）、广告位（访问 ads-gateway.dujiao-next.com）：只有后台可见，需要时再删
- 启动横幅：只出现在容器日志里
- 微信支付安全校验回声字符串前缀：只发给微信接口

仍能被识别的痕迹：API 路径结构、前端打包产物里的变量名，以及本仓库本身在 GitHub 上是否公开。要彻底隐藏，至少把 fork 设为私有。

## 品牌名填在哪

- 站点名、图标、页脚、关于页文案：后台「站点设置」
- 验证器里显示的名字：Environment 加 `APP_TOTP_ISSUER=<你的名字>`（部署分支已提供 `TOTP_ISSUER` 变量）

## 同步上游

```bash
# 一次性：加上游远程
git remote add upstream https://github.com/dujiao-next/dujiao-next.git

# 1. main 只快进；快进失败说明 main 被动过，先查 git log --oneline upstream/main..main
git fetch upstream
git checkout main
git merge --ff-only upstream/main
git push origin main

# 2. 把上游更新合并进 custom，有冲突就解，解完推送
git checkout custom
git merge main
git push origin custom
```

查看本分支相对上游改了什么：

```bash
git log --oneline main..custom
git diff main...custom --stat
```

## 回滚

```bash
# 撤销某一项改动，保留历史
git revert <commit>

# 放弃全部改动回到上游（慎用）
git reset --hard main
git push --force-with-lease origin custom
```

## 与 deploy 的关系

`deploy` 分支默认用官方镜像，**不包含**本分支的改动。本分支每次 push 都会由 GitHub Actions
（`.github/workflows/build-image.yml`）用仓库自带的 `Dockerfile` 构建镜像并推到 `ghcr.io/always1ov/shop`，
amd64 和 arm64 各一份，两个 tag：

- `custom`：始终指向最新一次构建
- `custom-<7 位提交号>`：固定不变，用于回滚

首次使用前到仓库的 Actions 页确认工作流已启用（fork 出来的仓库默认关闭，点一下启用即可）。
构建约 10 到 15 分钟，在 Actions 页看进度。

**上线本分支的版本**：Dokploy Environment 改两行，然后 Redeploy。

```
IMAGE_REPO=ghcr.io/always1ov/shop
IMAGE_TAG=custom
```

**回滚**：`IMAGE_TAG` 改成某个 `custom-<提交号>`；或改回官方镜像
`IMAGE_REPO=dujiaonext/dujiao-next`、`IMAGE_TAG=v1.4.7`。

**镜像私有时**：仓库私有则镜像默认也私有，NAS 拉取要登录。Dokploy → Settings → Registry 添加 `ghcr.io`，
用户名填 GitHub 用户名，密码填带 `read:packages` 权限的 Personal Access Token。仓库公开时镜像公开，不用登录。

**国内拉取慢**：镜像公开的话可以走 GHCR 镜像站，把 `IMAGE_REPO` 改成加速站给的前缀加 `always1ov/shop`；
或者换到国内仓库：仓库 Settings → Secrets and variables → Actions 配置

- Variables：`IMAGE_REGISTRY`（如 `registry.cn-hangzhou.aliyuncs.com`）、`IMAGE_NAME`（如 `<命名空间>/shop`）
- Secrets：`REGISTRY_USERNAME`、`REGISTRY_PASSWORD`

工作流文件不用改，`deploy` 那边把 `IMAGE_REPO` 改成新地址即可。

**升级流程**：按上面「同步上游」把 `main` 合并进 `custom` → push → 等构建完成 → Redeploy。
后台的「一键升级」在容器里被禁用，不要指望它。不要在 `deploy` 的 compose 里写 `build:`，
Dokploy 拉的是 `deploy` 分支，那上面没有源码。
