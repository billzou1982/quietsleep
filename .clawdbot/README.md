# .clawdbot — Agent Swarm (OpenClaw 原生版)

## 架构

```
Bill（需求）
    │
    ▼
Clawd（编排者 / Zoe）
    │  sessions_spawn
    ├──────────────► Worker A（sub-agent）→ PR #1
    ├──────────────► Worker B（sub-agent）→ PR #2
    └──────────────► Worker C（sub-agent）→ PR #3
                         │
                         ▼ push 通知
                     Clawd 更新状态 → 告知 Bill
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `active-tasks.json` | 任务注册表，Clawd 维护 |
| `orchestrator.md` | Clawd 的编排协议（Zoe 角色手册） |
| `agent-prompt-template.md` | 构造 worker prompt 的模板 |
| `README.md` | 本文档 |

## 使用方式

直接告诉 Clawd 你要做什么，他会处理其余的一切：

> "给 quietsleep 加深色模式"
> "swarm: 同时修三个 bug —— #12、#15、#18"

Clawd 会：
1. 分析任务，读取代码库相关部分
2. 用模板构造精准 prompt
3. `sessions_spawn` 启动 worker sub-agent（可多个并行）
4. 注册到 `active-tasks.json`
5. Worker 完成后自动通知，Clawd 转告 Bill + PR 链接

## 监控任务

Clawd 可随时查询：
- `subagents list` — 所有活跃的 worker
- `sessions_list` — 所有 session
- 查看 `active-tasks.json` 当前状态

## 与原版（tmux/shell）的区别

| | Elvis 原版 (Route B) | 我们的 Route A |
|--|---------------------|---------------|
| Worker 启动 | tmux + codex/claude CLI | sessions_spawn |
| 持久化 | 宿主机 tmux session | OpenClaw session |
| 监控 | check-agents.sh (shell) | subagents list |
| 通知 | openclaw system event | push 通知 |
| 需要 tmux | ✅ | ❌ |
| 需要 API key 配置 | ✅ | ❌（走 OpenClaw） |
| 沙箱兼容 | ❌ | ✅ |
