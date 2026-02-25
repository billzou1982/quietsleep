# Review Protocol — Main (Clawd) as Reviewer

## 触发时机
Coder 创建 PR 后，Main 自动执行 review。

## 执行步骤

### Step 1：获取 PR 信息
```bash
cd /home/billzou/clawd-coder/workspaces/quietsleep
gh pr list --state open --json number,title,headRefName,author
```

### Step 2：读取 diff
```bash
gh pr diff <PR号>
```

### Step 3：Main 分析（作为 Claude 原生分析，不用脚本）
检查以下几点：
- [ ] 改动是否符合任务描述
- [ ] 有没有明显 bug（类型错误、边界条件）
- [ ] 有没有破坏现有功能（看改动范围）
- [ ] TypeScript 类型是否正确
- [ ] 代码风格是否符合项目规范

### Step 4：发表 review
```bash
# 通过
gh pr review <PR号> --approve --body "✅ LGTM. 改动符合预期，无明显问题。"

# 需要修改
gh pr review <PR号> --request-changes --body "❌ 需要修改：\n- 问题1\n- 问题2"

# 只留评论（不 approve/reject）
gh pr review <PR号> --comment --body "💬 注意：..."
```

### Step 5：CI 通过后合并
```bash
# 等 CI 通过（检查状态）
gh pr checks <PR号>

# 合并
gh pr merge <PR号> --squash --delete-branch

# 通知 Bill
# 发 Telegram 消息："✅ PR #N 已合并：<标题>"
```

## 判断标准（quietsleep 专用）

### 必须通过
- `src/app/page.tsx` 改动不破坏现有状态管理
- 新增的 preset/noise/功能有对应的中英文文案
- 没有引入新的外部依赖（除非 Bill 明确要求）
- TypeScript 无 any（除非有注释说明原因）

### 警告但可以合并
- 代码重复（TODO 注释即可）
- 可以优化的写法（留 comment）

### 必须拒绝
- 删除了现有功能
- 引入了 console.error 但没有处理
- 类型断言掩盖了真实错误
