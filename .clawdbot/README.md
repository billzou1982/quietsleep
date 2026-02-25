# .clawdbot — Agent Swarm Infrastructure

Lightweight agent swarm setup for quietsleep. Inspired by @elvissun's OpenClaw swarm architecture.

## Dependencies


added 3 packages in 2s

2 packages are looking for funding
  run `npm fund` for details

## Usage

### Start a new agent task



This will:
1. Create a git worktree at 
2. Launch the agent in a tmux session 
3. Register the task in 
4. Notify via  when done

### Monitor all tasks



### Watch a specific agent live



### Send mid-task direction



## Task States

| Status    | Meaning                              |
|-----------|--------------------------------------|
|  | tmux session alive, agent working    |
|     | tmux exited, PR found on GitHub      |
|   | tmux exited, no PR created           |

## Cron (optional)

Add to crontab for automatic monitoring every 10 min:



## Architecture


