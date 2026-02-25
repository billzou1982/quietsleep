#!/usr/bin/env bash
# Usage: ./new-agent.sh <task-id> <branch-name> <agent: codex|claude> "description"
# Example: ./.clawdbot/new-agent.sh feat-login feat/login claude "Add Google OAuth login"

set -euo pipefail

TASK_ID="${1:?Usage: $0 <task-id> <branch-name> <agent> description}"
BRANCH="${2:?Missing branch name}"
AGENT="${3:?Missing agent: codex or claude}"
DESCRIPTION="${4:?Missing task description}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE="/tmp/wt-${TASK_ID}"
TMUX_SESSION="agent-${TASK_ID}"
TASKS_FILE="${REPO_ROOT}/.clawdbot/active-tasks.json"

echo "Starting agent swarm task: ${TASK_ID}"
echo "   Branch:   ${BRANCH}"
echo "   Agent:    ${AGENT}"
echo "   Worktree: ${WORKTREE}"

# 1. Create git worktree
if [ -d "${WORKTREE}" ]; then
  git -C "${REPO_ROOT}" worktree remove --force "${WORKTREE}" 2>/dev/null || rm -rf "${WORKTREE}"
fi
git -C "${REPO_ROOT}" worktree add -b "${BRANCH}" "${WORKTREE}" main

# 2. Install deps
(cd "${WORKTREE}" && npm install --silent 2>/dev/null || true)

# 3. Build agent command
NOTIFY="openclaw system event --text \"Done: ${TASK_ID}\" --mode now"

case "${AGENT}" in
  codex)
    CMD="codex --yolo \"${DESCRIPTION}\n\nWhen done, run: ${NOTIFY}\""
    ;;
  claude)
    CMD="claude --dangerously-skip-permissions -p \"${DESCRIPTION}\n\nWhen done, run: ${NOTIFY}\""
    ;;
  *)
    echo "Unknown agent: ${AGENT}. Use codex or claude."; exit 1 ;;
esac

# 4. Launch in tmux
tmux new-session -d -s "${TMUX_SESSION}" -c "${WORKTREE}" "bash -c \"${CMD}\"; echo '--- AGENT DONE ---'; sleep 3600"

# 5. Register task
TS=$(date +%s%3N)
ENTRY="{\"id\":\"${TASK_ID}\",\"tmuxSession\":\"${TMUX_SESSION}\",\"agent\":\"${AGENT}\",\"description\":\"${DESCRIPTION}\",\"worktree\":\"${WORKTREE}\",\"branch\":\"${BRANCH}\",\"startedAt\":${TS},\"status\":\"running\",\"notifyOnComplete\":true}"
CURR=$(cat "${TASKS_FILE}")
echo "${CURR}" | jq ". + [${ENTRY}]" > "${TASKS_FILE}"

echo ""
echo "Task registered! Monitor with:"
echo "   tmux attach -t ${TMUX_SESSION}"
echo "   .clawdbot/check-agents.sh"
