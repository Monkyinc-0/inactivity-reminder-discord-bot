// Byte_club Build-Log Reminder Bot
// Tracks when each user last posted in the #build-log channel,
// and DMs them a friendly nudge if they've gone quiet for too long.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const {
  Client,
  GatewayIntentBits,
  Partials,
} = require('discord.js');

// ---------- CONFIG ----------
const BUILD_LOG_CHANNEL_ID = process.env.BUILD_LOG_CHANNEL_ID; // ID of #build-log
const INACTIVITY_DAYS = parseInt(process.env.INACTIVITY_DAYS || '5', 10);
const DATA_FILE = path.join(__dirname, 'data.json');

// ---------- SIMPLE JSON "DATABASE" ----------
// Structure: { "userId": lastPostTimestampInMillis, ... }
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to read data.json, starting fresh.', err);
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let lastPostMap = loadData();

// ---------- DISCORD CLIENT ----------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel], // needed to DM users
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`Watching channel: ${BUILD_LOG_CHANNEL_ID}`);
  console.log(`Inactivity threshold: ${INACTIVITY_DAYS} days`);
});

// Whenever someone posts in #build-log, update their last-post time
client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== BUILD_LOG_CHANNEL_ID) return;

  lastPostMap[message.author.id] = Date.now();
  saveData(lastPostMap);
  console.log(`Updated last-post time for ${message.author.tag}`);
});

// ---------- DAILY CHECK ----------
// Runs once a day at 09:00 server time — adjust the cron string as you like.
// Cron format: minute hour day month weekday
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily build-log inactivity check...');

  const guild = client.guilds.cache.first(); // assumes bot is only in one server
  if (!guild) return console.error('No guild found.');

  await guild.members.fetch(); // make sure member cache is populated

  const now = Date.now();
  const thresholdMs = INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

  for (const [, member] of guild.members.cache) {
    if (member.user.bot) continue;

    const lastPost = lastPostMap[member.id];

    // If they've never posted, you can decide whether to nudge them too.
    // Here we only nudge people who HAVE posted before but gone quiet.
    if (!lastPost) continue;

    const timeSincePost = now - lastPost;

    if (timeSincePost > thresholdMs) {
      try {
        await member.send(
          `👋 Hey ${member.user.username}! It's been ${INACTIVITY_DAYS}+ days since your last #build-log update.\n\n` +
          `No pressure, but a quick post — even one line about what you're working on or stuck on — keeps the momentum going. 🔥`
        );
        console.log(`Sent reminder to ${member.user.tag}`);

        // Reset their timestamp so they don't get spammed daily until they post again.
        // Remove this line if you'd rather they get reminded every day until they post.
        lastPostMap[member.id] = now;
        saveData(lastPostMap);
      } catch (err) {
        console.error(`Could not DM ${member.user.tag} (DMs probably closed).`, err.message);
      }
    }
  }

  console.log('Inactivity check complete.');
});

client.login(process.env.DISCORD_TOKEN);
