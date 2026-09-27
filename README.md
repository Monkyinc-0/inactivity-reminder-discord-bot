# Byte_club Build-Log Reminder Bot

A simple Discord bot (Node.js + discord.js) that watches your `#build-log`
channel and DMs anyone who hasn't posted in 5+ days.

## What it does

- Listens to every message in `#build-log` and records the timestamp for
  whoever posted.
- The month is split into fixed checkpoint periods: **1–5, 6–10, 11–15,
  16–20, 21–25, 26–end of month**. On each checkpoint date (5, 10, 15, 20,
  25, and the last day of the month — this automatically handles
  shorter months like February), the bot checks everyone: did they post
  **anything** in #build-log during that period?
  - Yes → they're good, no message sent.
  - No → they get a friendly DM reminder.
- Any message counts toward a checkpoint — a regular progress update, a
  "stuck on this" post, or a "just finished the course!" completion
  message posted on any date within the period all satisfy it. There's
  no requirement to post on the checkpoint date itself, just sometime
  during that period.
- New members get a pass on the period they joined in — their first
  checkpoint is the next one after they join.
- Data is stored locally in `data.json` — no external database needed.

## 1. Create the bot on Discord's Developer Portal

1. Go to <https://discord.com/developers/applications>
2. Click **New Application**, give it a name (e.g. "Byte_club Bot")
3. Go to the **Bot** tab → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - **Server Members Intent**
   - **Message Content Intent**
5. Click **Reset Token** (or **Copy**) to get your bot token — keep this secret

## 2. Invite the bot to your server

1. Go to the **OAuth2 → URL Generator** tab
2. Under **Scopes**, check `bot`
3. Under **Bot Permissions**, check:
   - `Read Messages/View Channels`
   - `Send Messages`
   - `Read Message History`
4. Copy the generated URL, open it in your browser, and add the bot to
   Byte_club

## 3. Get your #build-log channel ID

1. In Discord, go to **User Settings → Advanced → Enable Developer Mode**
2. Right-click the `#build-log` channel → **Copy Channel ID**

## 4. Set up the project locally

```bash
# Install Node.js first if you don't have it: https://nodejs.org

# Unzip/copy this project folder, then inside it:
npm install
```

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
DISCORD_TOKEN=your_bot_token_here
BUILD_LOG_CHANNEL_ID=your_build_log_channel_id_here
```

## 5. Run the bot

```bash
npm start
```

You should see:

```
✅ Logged in as Byte_club Bot#1234
Watching channel: 123456789012345678
Inactivity threshold: 5 days
```

## 6. Keep it running 24/7 (optional, for later)

Running it on your own laptop only works while your laptop is on and
connected. Once you're ready to keep it running all the time, you can
deploy it for free/cheap on something like:

- [Railway](https://railway.app)
- [Render](https://render.com)
- A small VPS (e.g. Oracle Cloud free tier)

For now, running it locally with `npm start` while testing is totally fine.

## How the checkpoint logic works

- The bot only tracks users **after** it starts running — it won't know
  about posts made before it was online.
- The daily cron job runs every day but only does anything on the 6
  checkpoint days each month — other days it just logs "not a checkpoint
  day" and exits.
- On a checkpoint day, a user is reminded only if they haven't posted
  anything since the *start* of that period (e.g. for the 10th's
  checkpoint, that means nothing posted between the 6th and 10th).
- Each user only gets reminded once per checkpoint, even if the bot
  restarts partway through the day.
- Brand-new members aren't penalized for the period they joined in —
  they get a full period before their first checkpoint applies.

## Customizing

- Change the reminder message text in `index.js` (search for `member.send`)
- Change what time of day the check runs by editing the cron string
  `'0 20 * * *'` (currently runs daily at 8:00 PM server time — since
  it's checking whether *today's* period was satisfied, running it later
  in the day gives people the full checkpoint day to post)
- Change the checkpoint dates themselves by editing the `checkpoints`
  array inside `getTodaysCheckpoint()` in `index.js`

## Good first contributions if you want to extend this

- Post a reminder in the channel too (not just DM) if someone's DMs are closed
- Add a leaderboard command showing most consistent posters
- Track streaks (e.g. "posted 5 weeks in a row 🔥")