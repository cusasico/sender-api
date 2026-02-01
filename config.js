const fs = require('fs'), 
      dotenv = fs.existsSync('config.env') ? require('dotenv').config({ path: '/.env' }) : undefined,
      convertToBool = (text, fault = 'true') => text === fault; 

module.exports = {
SESSION_ID: process.env.SESSION_ID, 
AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",
AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || "true",
THUMBNAIL: process.env.THUMBNAIL || "https://gitcdn.giftedtech.co.ke/image/AZO_image.jpg",
API_URL: process.env.API_URL || "https://whatsapp.giftedtech.co.ke", // Fill in this after deploying and only if you tend to use api for other functions such as whatsapp notifications
AUTO_LIKE_EMOJIS: process.env.AUTO_LIKE_EMOJIS || "💛,❤️,💜,🤍,💙", // Can be one Emoji or Multiple Emojis Separated by Commas
MODE: process.env.MODE || "private", // Put private or public or inbox or groups
AUTO_READ_MESSAGES: process.env.AUTO_READ_MESSAGES || "true",
NEWSLETTER_JID: process.env.NEWSLETTER_JID || "120363403054496228@newsletter",
NEWSLETTER_URL: process.env.NEWSLETTER_URL || "https://whatsapp.com/channel/0029Vb6lNd511ulWbxu1cT3A",
PRESENCE: process.env.PRESENCE || "typing", // Choose one: typing, recording, online, null
TIME_ZONE: process.env.TIME_ZONE || "Africa/Nairobi", // Enter yours else leave blank if not sure
};

let file = require.resolve(__filename); 
fs.watchFile(file, () => { fs.unwatchFile(file); console.log(`Update '${__filename}'`); delete require.cache[file]; require(file); });
