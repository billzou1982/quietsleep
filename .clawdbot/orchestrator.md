# Orchestrator Protocol — Main (Clawd) as Zoe

## 角色分工

| 角色 | Agent | 职责 |
|------|-------|------|
| 编排者 (Zoe) | **Main (Clawd)** | 接收需求 / 拆任务 / 写 inbox / 监控进度 / 告知 Bill |
| 开发者 (Worker) | **Coder** | 读 inbox / 写代码 / 建 PR / 写 outbox |

Main **不写业务代码**。Coder **不直接和 Bill 对话**。

---

## Main 的派发流程

### Step 1：理解任务
- 读取相关代码（Read 工具）
- 明确验收标准
- 拆成独立可执行的子任务

### Step 2：写 inbox 任务文件
路径：`/home/billzou/clawd-coder/inbox/{task-id}.md`

模板：
```markdown
# TASK: {task-id}
## 描述
{具体、可执行的功能说明}

## 相关文件
- src/app/page.tsx（第 xxx 行附近）

## 验收标准
- [ ] 功能 A 正常
- [ ] 不破坏现有功能

## 分支名
feat/{task-id}

## PR 标题
feat: {简短描述}
```

### Step 3：等待 Coder 处理
Coder 在下次 heartbeat（每 60 分钟）或被唤醒时处理。
告知 Bill："任务已派给 Coder，最多 60 分钟内处理。"

### Step 4：监控进度
Coder 完成后在 outbox/ 写结果文件。Main 检查：
```bash
ls /home/billzou/clawd-coder/outbox/
cat /home/billzou/clawd-coder/outbox/{task-id}_DONE.md
```

### Step 5：告知 Bill
把 PR 链接、完成内容转告 Bill。

---

## active-tasks.json 维护
- 写 inbox 时：Main 更新 status = "pending"
- Coder 开始时：Coder 更新 status = "running"
- PR 创建后：Coder 更新 status = "done", pr = PR号

---

## 紧急/简单任务的例外
单行 hotfix / 配置变更，Main 可直接用 `exec elevated=true` 操作，无需走 inbox。
