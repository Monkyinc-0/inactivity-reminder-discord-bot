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
INACTIVITY_DAYS=5
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

## How the reminder logic works

- The bot only tracks users **after** it starts running — it won't know
  about posts made before it was online.
- A user only gets reminded if they've posted **at least once** before and
  then gone quiet for `INACTIVITY_DAYS`. (You can change this in `index.js`
  if you also want to remind people who've never posted at all.)
- After sending a reminder, the bot resets that user's timer so they don't
  get DMed again every single day — just once per inactivity period.

## Customizing

- Change the reminder message text in `index.js` (search for `member.send`)
- Change the check time by editing the cron string `'0 9 * * *'`
  (currently runs daily at 9:00 AM server time)
- Change `INACTIVITY_DAYS` in `.env` to adjust the cutoff

## Good first contributions if you want to extend this

- Post a reminder in the channel too (not just DM) if someone's DMs are closed
- Add a leaderboard command showing most consistent posters
- Track streaks (e.g. "posted 5 weeks in a row 🔥")
