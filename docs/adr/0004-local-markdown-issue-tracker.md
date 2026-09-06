---
status: accepted
---
# issue tracker 用仓库内的本地 Markdown，不用 GitHub Issues

这是单人项目，接手的 AI 可能运行在没有 `gh` CLI、甚至访问不到 GitHub API 的环境里（例如 Claude Code 网页版），而 spec 与 tickets 又必须让任何 AI 都能读到。所以 issue tracker 选本地 Markdown：`.scratch/<feature>/spec.md` 与 `.scratch/<feature>/issues/NN-slug.md`，随代码一起提交。要换成 GitHub Issues 时只需改 `docs/agents/issue-tracker.md`。
