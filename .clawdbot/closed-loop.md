# Closed Loop Protocol — 单 Coder 全流程

## 完整流程

```
Bill → Coder（一句话需求）
    ↓
[Coder] 建分支 → 实现 → commit → push → gh pr create
    ↓
[GitHub Actions CI] 自动触发（build + lint + type-check）
    ↓
[Main Reviewer] 读 diff → 分析 → gh pr review
    ↓
  全部通过？
   ├─ 是 → Main merge → 告知 Bill ✅
   └─ 否 → Coder 收到 review → 修改 → 重新 push
                              ↑__________________|
```

## 各方职责

### Coder（实现者）
- 收到需求后自动走 6 步流程
- 收到 review request-changes 后修改并 push（PR 自动更新）
- 不需要 Bill 介入

### GitHub Actions（Test Agent）
- PR 一创建就自动跑
- 失败了在 PR 页面显示，Coder 看到后自行修复

### Main（Reviewer + 合并者）
- PR 创建后读 diff，发 review
- CI 通过 + review 通过 → merge
- merge 后告知 Bill

## 触发 Review 的时机

Main 需要知道"有新 PR 需要 review"。方案：

### 方案 A：Coder 通知 Main（推荐）
Coder 创建 PR 后，在 Bill 群里发一条消息：
"PR #N 已创建：<title>\n🔗 <url>\n等待 review。"

Main 看到这条消息 → 读 diff → review。

### 方案 B：Main 定期扫描（兜底）
Main heartbeat 检查 open PR：
```bash
cd /home/billzou/clawd-coder/workspaces/quietsleep
gh pr list --state open --json number,title,createdAt
```
有未 review 的 PR → 立刻处理。

## 当前状态

- [x] CI workflow 已创建（.github/workflows/ci.yml）
- [x] Review protocol 已创建（.clawdbot/review-protocol.md）
- [ ] Coder 全流程验证（待 Bill 给 Coder 一个真实任务测试）
- [ ] Coder → Main 完成通知（待配置）
- [ ] Main heartbeat 扫描 PR（待配置）
