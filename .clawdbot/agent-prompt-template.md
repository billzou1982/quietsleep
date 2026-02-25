# Worker Agent Prompt Template

当派发 sub-agent 时，用以下结构构造 prompt：

---

## 项目信息
- **Repo**: quietsleep (`/home/billzou/clawd-coder/workspaces/quietsleep/`)
- **Stack**: Next.js 16, React 19, TypeScript
- **GitHub**: https://github.com/billzou1982/quietsleep

## 任务
{{TASK_DESCRIPTION}}

## 相关文件
{{RELEVANT_FILES}}

## 验收标准
{{ACCEPTANCE_CRITERIA}}

## 实现要求
1. 在新分支 `{{BRANCH_NAME}}` 上实现（从 main checkout）
2. 遵循现有代码风格（TypeScript strict，函数组件，Tailwind CSS）
3. 不破坏现有功能
4. commit message 格式：`feat: {{SHORT_DESCRIPTION}}`

## 完成步骤（必须全部执行）
```bash
# 1. 切到新分支
cd /home/billzou/clawd-coder/workspaces/quietsleep
git checkout -b {{BRANCH_NAME}} main

# 2. 实现功能（用 Read/Write/Edit 工具）

# 3. 提交
git add -A
git commit -m "feat: {{SHORT_DESCRIPTION}}"
git push origin {{BRANCH_NAME}}

# 4. 创建 PR
gh pr create --title "{{PR_TITLE}}" --body "{{PR_BODY}}" --base main

# 5. 回报（关键！）
# 在最后一步，用 sessions_send 发消息给 main session 告知完成
```

## 注意
- 所有 git/gh 命令用 `exec elevated=true`
- 不要修改 `.clawdbot/` 目录
- 如遇到阻塞超过 10 分钟的问题，直接报告原因并停止

---
