# Byte_club Build-Log Reminder Bot

A simple Discord bot (Node.js + discord.js) that watches your `#build-log`
channel and DMs anyone who hasn't posted in 5+ days.

## What it does

- Listens to every message in `#build-log` and records the timestamp for
  whoever posted.
- Once a day, checks everyone in the server: if it's been more than
  `INACTIVITY_DAYS` (default: 5) since their last post, it sends them a
  friendly DM reminder.
- Data is stored locally in `data.json` — no external database needed.

