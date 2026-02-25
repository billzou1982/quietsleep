# Orchestrator Protocol — Main (Clawd) as Zoe

## 角色分工

| 角色 | Agent | 职责 |
|------|-------|------|
| 编排者 (Zoe) | **Main (Clawd)** | 接需求 → 拆任务 → 派给 Coder → 监控 → 告知 Bill |
| 开发者 (Worker) | **Coder** | 收任务 → 写代码 → PR → 回报 |

Main **不写业务代码**。Coder **不直接和 Bill 对话**。

---

## 派任务给 Coder（核心命令）

```bash
# Main 用 elevated exec 发消息给 Coder 的 Telegram group
openclaw message send \
  --channel telegram \
  --target "-5132223568" \
  --message "任务内容"
```

这是 Main → Coder 的唯一正确通道（sessions_send 被沙箱隔离，无法使用）。

---

## 完整 Swarm 流程

```
你（需求）
    │
    ▼
Main（编排者 Zoe）
    │  openclaw message send → Coder Telegram group
    ▼
Coder（Worker，自己的沙箱有 clawd-coder 挂载）
    │  git checkout -b feat/xxx main
    │  → 实现功能
    │  → git commit && git push
    │  → gh pr create
    │  → openclaw message send 回报 Main
    ▼
Main 告知 Bill + PR 链接
```

---

## Main 的派任务模板

当 Bill 给 Main 一个 quietsleep 开发需求时：

### Step 1：读代码上下文
```
Read: /home/billzou/clawd-coder/workspaces/quietsleep/src/app/page.tsx
```

### Step 2：构造任务 prompt（精准、可执行）
```
# TASK: {task-id}

## 项目
quietsleep: /home/billzou/clawd-coder/workspaces/quietsleep/
Stack: Next.js 16 + React 19 + TypeScript + Tailwind
GitHub: https://github.com/billzou1982/quietsleep

## 功能描述
{具体说明，包含相关文件和行号}

## 验收标准
- [ ] ...

## 开发步骤
1. git checkout -b {branch} main
2. 实现（修改 src/app/page.tsx）
3. git add src/app/page.tsx && git commit -m "{msg}"
4. git push origin {branch}
5. gh pr create --title "..." --body "..." --base main --head {branch}
6. 回报 PR URL 给 Main：
   openclaw message send --channel telegram --target "<Main group ID>" --message "PR done: <url>"
```

### Step 3：发送
```bash
# elevated exec
openclaw message send --channel telegram --target "-5132223568" --message "$(cat task.md)"
```

### Step 4：更新 active-tasks.json
```json
{ "id": "...", "status": "pending", "sentAt": ... }
```

### Step 5：监控
等 Coder 回报（可能需要 1-5 分钟）。收到后告知 Bill。

---

## Coder 的 Telegram group
- Group ID: `-5132223568`
- 发消息命令：`openclaw message send --channel telegram --target "-5132223568" --message "..."`

## active-tasks.json 状态流
pending → running（Coder 开始） → done（PR 创建后）
