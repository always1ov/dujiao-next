# AGENTS.md

本仓库是 `always1ov/dujiao-next`，上游 `dujiao-next/dujiao-next`（Go + Vue 数字商品自助商店）的定制 fork。
任何接手的 AI（Claude Code、Codex 或其他）先读完本文件再动手。`CLAUDE.md` 是本文件的符号链接。

## 先读什么

1. `CUSTOM.md`：分支布局、同步与回滚命令、去品牌规则、变更清单。本仓库最重要的约束文件。
2. `CONTEXT.md`：领域词汇表。写代码、起名、写 issue、写提交信息都用这里的词。
3. `docs/adr/`：已经做出的、难以逆转的决定。与之冲突时先说明理由再改。
4. `README.md` 的 Architecture、RBAC、Build Tags、Frontend Notes 四节：上游的硬约束。
   分层 import 规则由 `internal/architecture` 测试强制；新增后台路由必须写进 `internal/authz/bootstrap.go` 的角色种子；
   前台与 API 文案必须走 i18n（zh-CN / zh-TW / en-US）；后台原生链接必须走 `adminUrl()`。
5. `.scratch/`：进行中的工作（spec、tickets、research）。当前进行中：`.scratch/rebrand/`（自建品牌与前台重排）。

## 分支规则（不可违反）

- `main`：只允许 fast-forward 同步上游，永不直接提交。
- `custom`：所有定制都在这里。优先新增文件，少改上游文件，让 `git merge main` 尽量无冲突。
- `deploy`：孤儿分支，只放 `docker-compose.yml`、`env.example`、`README.md`。
- 仓库里绝不出现真实密钥、内网 IP、宿主机路径。
- 访客能看到的地方不得出现上游品牌名与链接（规则与保留项见 `CUSTOM.md`）。
- 推送 `custom` 会触发 `.github/workflows/build-image.yml` 构建镜像到 GHCR；部署侧在 Dokploy 点 Redeploy。

## 常用命令

```bash
# 前台
cd frontend/user  && pnpm install --frozen-lockfile && pnpm run build && pnpm test
# 后台（fullstack 模式，注入 <base> 占位符）
cd frontend/admin && pnpm install --frozen-lockfile && pnpm run build:fullstack
# Go
gofmt -l internal/ && go vet ./... && go build ./... && go test ./internal/...
# 全栈二进制（本地看效果用）
rm -rf internal/web/dist && mkdir -p internal/web/dist \
  && cp -r frontend/admin/dist internal/web/dist/admin && cp -r frontend/user/dist internal/web/dist/user \
  && go build -tags fullstack -o /tmp/dj ./cmd/server
```

本地起完整栈需要一个 Redis（`redis-server --daemonize yes`）和一份 `config.yml`（从 `config.yml.example` 复制，三个 secret 必须互不相同且足够随机，否则拒绝启动）。
店面模板预览：任意地址加 `?template=classic|vault|md3`，`?template=reset` 取消。

## 提交前验证清单

- 前台 `pnpm run build`（含 vue-tsc）与 `pnpm test` 通过
- 后台 `pnpm run build:fullstack` 通过
- `go test ./internal/...` 通过（含架构分层测试与 RBAC 覆盖测试）
- 改了前台页面：本地起全栈用 Chromium 截桌面与手机两种视图看一眼（步骤与脚本见 `docs/agents/smoke-test.md`）
- `CUSTOM.md` 变更清单加一行
- 提交信息用 `CONTEXT.md` 的词汇，说清为什么

## Agent skills

本仓库安装了 [mattpocock/skills](https://github.com/mattpocock/skills)（MIT）的 engineering + productivity 两组 skill。
文件在 `.agents/skills/<name>/`（Codex 等通用位置），`.claude/skills/<name>` 是指向它们的符号链接（Claude Code）。
更新：`npx skills update`；锁定版本见 `skills-lock.json`。不知道该用哪个 skill 时先 `/ask-matt`。

### Issue tracker

本仓库用本地 Markdown 当 issue tracker：一个功能一个目录 `.scratch/<feature>/`，spec 在 `spec.md`，票在 `issues/NN-slug.md`。
详见 `docs/agents/issue-tracker.md`。要换成 GitHub Issues 时只改那一个文件。

### Triage labels

五个默认角色标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### Domain docs

single-context：根目录 `CONTEXT.md` + `docs/adr/`。详见 `docs/agents/domain.md`。

## 工作流（想法 → 上线）

1. `/grill-with-docs`：把想法问清楚，顺手更新 `CONTEXT.md` 与 ADR。设计与品牌类改动必须先过这一步。
2. `/to-spec`：把对话收成 `.scratch/<feature>/spec.md`。
3. `/to-tickets`：拆成 `.scratch/<feature>/issues/NN-slug.md`，写明 Blocked by。
4. 每张票 `/implement`（内部走 `/tdd`，收尾跑 `/code-review`），过验证清单后提交到 `custom`。
5. 隔几天跑一次 `/improve-codebase-architecture`，报告里挑一个再回到第 1 步。
6. 出 bug 用 `/diagnosing-bugs`；同步上游冲突用 `/resolving-merge-conflicts`（永远不 `--abort`）。
7. 换会话或换工具接手：先 `/handoff` 写交接文件，新会话从交接文件开始。

## 已经做过的（别重做）

- 去品牌（`f7273e4`）、内置默认文案（`2ef2b3e`、`8a6aaba`）、账户入口开关（`edd2e47`、`4ab478b`）
- 第三套店面模板 `md3`（`06e3a3f`）与评审收口（`929c8f9`）
- 架构勘察候选与 Top 推荐记录在 `.scratch/architecture/report.md`
