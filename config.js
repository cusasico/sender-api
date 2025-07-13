const fs = require('fs'), 
      dotenv = fs.existsSync('config.env') ? require('dotenv').config({ path: '/.env' }) : undefined,
      convertToBool = (text, fault = 'true') => text === fault;

module.exports = {
SESSION_ID: process.env.SESSION_ID || "", 
AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",
AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || "true",
THUMBNAIL: process.env.THUMBNAIL || "https://files.giftedtech.web.id/file/gifted-md.jpg",
API_URL: process.env.API_URL || "https://whatsapp.giftedtech.web.id", // Fill in this after deploying and only if you tend to use api for other functions such as whatsapp notifications
AUTO_LIKE_EMOJIS: process.env.AUTO_LIKE_EMOJIS || "💛,❤️,💜,🤍,💙", // Can be one Emoji or Multiple Emojis Separated by Commas
MODE: process.env.MODE || "private", // Put private or public or inbox or groups
AUTO_READ_MESSAGES: process.env.AUTO_READ_MESSAGES || "true",
PRESENCE: process.env.PRESENCE || "typing", // Choose one: typing, recording, online, null
TIME_ZONE: process.env.TIME_ZONE || "Africa/Nairobi", // Enter yours else leave blank if not sure
};

let file = require.resolve(__filename); 
fs.watchFile(file, () => { fs.unwatchFile(file); console.log(`Update '${__filename}'`); delete require.cache[file]; require(file); });
