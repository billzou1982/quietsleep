#!/usr/bin/env bash
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TASKS_FILE="${REPO_ROOT}/.clawdbot/active-tasks.json"

echo ""
echo "=== Agent Swarm Tasks ==="
jq -r '.[] | "  [\(.status | ascii_upcase)] \(.id) | \(.agent) | \(.branch) | \(.description[:60])"' "${TASKS_FILE}"
echo ""
