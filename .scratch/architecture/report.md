# 架构勘察（improve-codebase-architecture）2026-09-06

范围：最近改动最多的地方（三套店面模板、共享 composables、Go 站点设置归一化、后台换肤）。词汇按 `codebase-design`：模块、接口、深度、接缝、适配器、杠杆、局部性。可视化版本发布在 Claude Artifact（会话内链接），本文件是随仓库保存的文字版。

## 已做掉（提交 929c8f9）

1. **md3 首页改走 useNavConfig 接缝**（Strong）：首页不再自己解析 `template_mode` 与 `nav_config.builtin`，开关语义只在一处。
2. **商品卡与列表项共用 useProductCard**（Strong）：封面兜底、库存 chip、价签徽章收进 `templates/md3/useProductCard.ts`，组件只剩版式。
3. **归一化契约用表驱动测试钉住**（Strong）：`site_normalize_template_test.go` 覆盖店面模板与账户入口开关的接受集、回退与布尔强转。

## 待挑选

4. **把模板解析抽成纯函数，让 registry 可测**（Strong，Top 推荐）
   - 文件：`frontend/user/src/templates/registry.ts`，新建 `templates/resolve.ts` 与 `tests/storefrontTemplate.test.ts`
   - 问题：所有页面挂在 `getActiveTemplate` 这一个接缝上，它内部直接读 localStorage 与 pinia，没法在 node 里测「覆盖优先于配置、未知值回退、找不到页面回退 classic loader」。
   - 方案：抽 `resolveStorefrontTemplate(configValue, override)` 与 `pickView(active, views, name, classicLoader)` 两个纯函数，副作用留在薄适配器。
   - 注意：registry.ts 是上游文件，纯函数放新文件把冲突面压到几行。
5. **站点品牌读法收进 useSiteBrand**（Worth exploring）
   - 7 处各写一遍「站点名 → 去空白 → 兜底 Store」：`Md3Layout.vue`、`useAbout.ts`、`useLegal.ts`、`useLogin.ts`、`useForgot.ts`、`useNotFound.ts`、`VaultLayout.vue`（上游，先不动）。
   - 方案：一个 `useSiteBrand()` 返回 `name / logo / description`，先只接 fork 自己的文件。自建品牌阶段会用到。
6. **调色板生成脚本进仓库，前后台共用一个种子**（Worth exploring）
   - md3.css 62 个色值与后台 style.css 38 个 HSL 值分别手工维护，换主题色要改 100 个数字。
   - 方案：`scripts/md3-palette.mjs` 用 `@material/material-color-utilities` 同时生成两份 token 块。决定点：是否在 CI 里做 drift 检查。
7. **订单区块三份复制**（Speculative，先不做）
   - 逻辑已在 `useOrderDisplayHelpers` 深模块里，复制的只是版式；抽走上游那两份会持续制造同步冲突。等第四套模板再看。

## 现有测试覆盖

- `frontend/user/tests/*.test.ts`：全是纯函数测试，registry / useNavConfig / legalDefaults 均无覆盖。
- `internal/modules/settings/application/*_test.go`：归一化现已有店面模板与导航开关用例。
