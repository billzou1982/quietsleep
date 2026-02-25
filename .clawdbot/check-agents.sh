#!/usr/bin/env bash
# Checks all running agent tasks - pure shell, no AI calls

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TASKS_FILE="${REPO_ROOT}/.clawdbot/active-tasks.json"

if ! command -v jq &>/dev/null; then
  echo "ERROR: jq not found. Install with: sudo apt install jq"; exit 1
fi

RUNNING=$(jq -r '.[] | select(.status=="running") | .id' "${TASKS_FILE}")

if [ -z "${RUNNING}" ]; then
  echo "No running tasks."
  exit 0
fi

UPDATED=$(cat "${TASKS_FILE}")

while IFS= read -r TASK_ID; do
  SESSION=$(jq -r ".[] | select(.id==\"${TASK_ID}\") | .tmuxSession" "${TASKS_FILE}")
  BRANCH=$(jq -r ".[] | select(.id==\"${TASK_ID}\") | .branch" "${TASKS_FILE}")

  TMUX_ALIVE=false
  tmux has-session -t "${SESSION}" 2>/dev/null && TMUX_ALIVE=true

  HAS_PR=false
  gh pr list --head "${BRANCH}" --json number --jq '.[0].number' 2>/dev/null | grep -q '[0-9]' && HAS_PR=true

  if ${TMUX_ALIVE}; then
    echo "RUNNING: ${TASK_ID} (tmux: ${SESSION})"
  elif ${HAS_PR}; then
    TS=$(date +%s%3N)
    PR_NUM=$(gh pr list --head "${BRANCH}" --json number --jq '.[0].number' 2>/dev/null)
    echo "DONE: ${TASK_ID} -> PR #${PR_NUM}"
    UPDATED=$(echo "${UPDATED}" | jq "map(if .id==\"${TASK_ID}\" then .status=\"done\" | .completedAt=${TS} | .pr=${PR_NUM} else . end)")
  else
    TS=$(date +%s%3N)
    echo "FAILED: ${TASK_ID} (no tmux, no PR)"
    UPDATED=$(echo "${UPDATED}" | jq "map(if .id==\"${TASK_ID}\" then .status=\"failed\" | .completedAt=${TS} else . end)")
  fi
done <<< "${RUNNING}"

echo "${UPDATED}" | jq '.' > "${TASKS_FILE}"
