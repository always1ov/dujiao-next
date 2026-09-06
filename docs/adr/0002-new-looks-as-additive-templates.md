---
status: accepted
---
# 新外观一律做成新增的店面模板，不改上游页面

上游前台有 6 万多行，直接在页面上改样式会让每次同步上游都冲突。所以任何新外观（md3、之后的自建品牌）都做成 `frontend/user/src/templates/<name>/` 下的一套新文件，靠 `registry.ts` 的模板回退机制接入：有同名页面用模板版，没有就回退 classic。页面只负责版式，业务逻辑全部复用 `composables/`，不复制逻辑。

## Consequences

- 上游新增页面时新模板会先以 classic 样式出现，不会白屏，但需要补一页。
- 三套模板的订单区块等版式会重复，这是有意为之；逻辑层（composables）是唯一的深模块。
