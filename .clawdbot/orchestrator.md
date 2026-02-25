# Orchestrator Protocol (Clawd as Zoe)

## 角色
Clawd 担任编排者（Zoe）。Bill 描述需求，Clawd 负责：
1. 理解任务范围
2. 构造详细 prompt（包含代码库上下文）
3. 通过 `sessions_spawn` 启动 worker sub-agent
4. 更新 active-tasks.json
5. 任务完成后通知 Bill

## 触发方式
Bill 可以直接说需求，或前缀 `swarm:` 明确表示要并行处理：
- "给 quietsleep 加深色模式"
- "swarm: 修复计时器归零崩溃"
- "swarm: 三个任务并行 —— A、B、C"

## 派发流程

### Step 1：读取代码库上下文
启动 sub-agent 前，先了解：
- 项目结构（`src/`、`apps/`）
- 相关文件路径
- 现有实现风格（TypeScript、Next.js 规范）

### Step 2：构造 worker prompt
使用 `agent-prompt-template.md` 为模板，填充：
- 任务描述（具体、可执行）
- 相关文件路径
- 验收标准
- commit 规范
- 完成后必须执行的回报命令

### Step 3：spawn worker
```
sessions_spawn(
  task="<完整 prompt>",
  mode="run",          # 一次性任务用 run
  label="swarm-<id>",
  agentId="coder",     # 用 coder agent
  runTimeoutSeconds=1800
)
```

### Step 4：注册到 active-tasks.json
```json
{
  "id": "feat-xxx",
  "sessionLabel": "swarm-feat-xxx",
  "description": "...",
  "branch": "feat/xxx",
  "startedAt": 1740000000000,
  "status": "running"
}
```

### Step 5：完成后更新状态
Sub-agent 完成时会 push 通知回来。收到后：
1. 更新 active-tasks.json status → done
2. 告知 Bill PR 号和结果

## Worker 的职责（sub-agent 做什么）
- 读取代码库（Read/Write/Edit 工具）
- 实现功能
- 写测试
- git commit（elevated exec）
- git push + gh pr create（elevated exec）
- 发送完成通知回给 Clawd
