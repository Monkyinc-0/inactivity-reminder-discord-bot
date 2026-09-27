// Byte_club Build-Log Reminder Bot
// Tracks when each user last posted in the #build-log channel,
// and DMs them a nudge if they miss a calendar checkpoint (5, 10, 15,
// 20, 25, last day of month) without posting anything since the
// previous checkpoint.
 
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
const DATA_FILE = path.join(__dirname, 'data.json');
 
// ---------- SIMPLE JSON "DATABASE" ----------
// Structure: {
//   "userId": {
//     lastPost: <timestampInMillis>,
//     lastReminderPeriod: "YYYY-MM-DD" (the checkpoint date they were last reminded for)
//   }
// }
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
 
let userData = loadData();
 
// ---------- CHECKPOINT HELPERS ----------
// Periods within a month: 1-5, 6-10, 11-15, 16-20, 21-25, 26-end.
function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
 
// If today is a checkpoint day, returns { periodStart, periodEnd, key }.
// Otherwise returns null.
function getTodaysCheckpoint(now) {
  const day = now.getDate();
  const lastDay = daysInMonth(now);
  const checkpoints = [5, 10, 15, 20, 25, lastDay];
 
  if (!checkpoints.includes(day)) return null;
 
  const idx = checkpoints.indexOf(day);
  const startDay = idx === 0 ? 1 : checkpoints[idx - 1] + 1;
 
  const periodStart = new Date(now.getFullYear(), now.getMonth(), startDay, 0, 0, 0, 0);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), day, 23, 59, 59, 999);
  const key = periodEnd.toISOString().slice(0, 10); // "YYYY-MM-DD", used to avoid double-reminding
 
  return { periodStart, periodEnd, key };
}
 
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
  console.log('Checkpoint schedule: 5, 10, 15, 20, 25, and the last day of each month');
});
 
// Whenever someone posts in #build-log, update their last-post time.
// Any message counts — a regular update, a stuck-on-this post, or a
// "just finished X!" completion message all satisfy the checkpoint.
client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== BUILD_LOG_CHANNEL_ID) return;
 
  const id = message.author.id;
  userData[id] = userData[id] || {};
  userData[id].lastPost = Date.now();
  saveData(userData);
  console.log(`Updated last-post time for ${message.author.tag}`);
});
 
// ---------- DAILY CHECK ----------
// Runs once a day — only actually does anything on checkpoint days
// (5, 10, 15, 20, 25, last day of month). Cron format: minute hour day month weekday
cron.schedule('0 20 * * *', async () => {
  const now = new Date();
  const checkpoint = getTodaysCheckpoint(now);
 
  if (!checkpoint) {
    console.log('Not a checkpoint day — skipping.');
    return;
  }
 
  console.log(`Running checkpoint check for period ending ${checkpoint.key}...`);
 
  const guild = client.guilds.cache.first(); // assumes bot is only in one server
  if (!guild) return console.error('No guild found.');
 
  await guild.members.fetch(); // make sure member cache is populated
 
  for (const [, member] of guild.members.cache) {
    if (member.user.bot) continue;
 
    const record = userData[member.id];
    const lastPost = record ? record.lastPost : null;
 
    // Never posted at all: only nudge if they were already a member
    // before this period started (give new joiners the rest of the
    // period before their first checkpoint applies).
    const joinedBeforePeriod = member.joinedTimestamp && member.joinedTimestamp < checkpoint.periodStart.getTime();
 
    const postedThisPeriod = lastPost && lastPost >= checkpoint.periodStart.getTime() && lastPost <= checkpoint.periodEnd.getTime();
 
    if (postedThisPeriod) continue; // they're good for this checkpoint
 
    if (!lastPost && !joinedBeforePeriod) continue; // brand new member, give them a pass this period
 
    // Avoid double-DMing if the cron somehow runs twice on the same checkpoint day
    if (record && record.lastReminderPeriod === checkpoint.key) continue;
 
    try {
      await member.send(
        `👋 Hey ${member.user.username}! We just hit a checkpoint day (the ${now.getDate()}${getOrdinalSuffix(now.getDate())}) and I don't see an update from you in #build-log since the last one.\n\n` +
        `No pressure — even one line about what you're working on, stuck on, or just finished keeps things moving. Drop an update whenever you get a chance. 🔥`
      );
      console.log(`Sent checkpoint reminder to ${member.user.tag}`);
    } catch (err) {
      console.error(`Could not DM ${member.user.tag} (DMs probably closed).`, err.message);
    }
 
    userData[member.id] = userData[member.id] || {};
    userData[member.id].lastReminderPeriod = checkpoint.key;
    saveData(userData);
  }
 
  console.log('Checkpoint check complete.');
});
 
function getOrdinalSuffix(day) {
  if (day % 10 === 1 && day !== 11) return 'st';
  if (day % 10 === 2 && day !== 12) return 'nd';
  if (day % 10 === 3 && day !== 13) return 'rd';
  return 'th';
}
 
client.login(process.env.DISCORD_TOKEN);