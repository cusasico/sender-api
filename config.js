const fs = require('fs'), 
      dotenv = fs.existsSync('config.env') ? require('dotenv').config({ path: '/.env' }) : undefined,
      convertToBool = (text, fault = 'true') => text === fault; 

module.exports = {
SESSION_ID: process.env.SESSION_ID || "Gifted~H4sIAAAAAAAAA5VU226jSBD9lVW/2poA5mKQIg0GjC/BEMCOYbUPbWigbWgwNNh4lH9f4SSTedidzfLUVLeqTp1zqn4AUuIGrVEPlB+gqnEHKRqOtK8QUMCsTRJUgzGIIYVAAfZsMr3q50lknbsbMa6hc/bKkevuOxtz1lU6q7ftIcmD+X75CF7HoGoPOY5+k3B3FdayacmF3cCR/ZJO/UVgC86q6p+x0E6sxFy4WtnNwxP/CF6HjBDXmKRGlaEC1TBfo96BuP4afGwhL/bmt1lpzwvfiHrVYQ6Xxl/q81Q9mrdsVAXWfrfoXvivwZ8L/KJtW3TdMgeK2gNRnSdr4yeJHugvTBFub+GDumuDEXN5g9/glKB4GSNCMe2/zHuhyZq+6cWX5wdoJlnmcJsgvERVXOBL1oQ5nlS7B1uaMcX2a8DDbKvtCSm61mejHpcMF15JxfFWkHjVjNX2e+q6ct4mE+ZX4E794ZXT/+Gdn9nrrUH9gkjWVCJGb7l5c/bTwvD0nnf3ErosF+Klktgvwpf5ZmcIz2SVW6bkMjer8v0V2zKjkRE+X8SNUR51ftZL9cL6hA9pW/8OpbGbnkNfMq79peu2AgmyC4eT80pvZCiZuWcZkaxf96eg26+jZMKtNrY7O5NMFvWNn+aTzuQIc6pUAaXNYZmzx353Up8f7x2dUL+MgcK+jkGNUtzQGlJckntsIo4BjDsPRTWid3rBPNJCr9bifemuernV/PLUXRcyEe14dDymMln0Or/dmi7hH8EYVHUZoaZB8QI3tKx7CzUNTFEDlD//GgOCrvRNuKHchB2DBNcN3ZK2yksYf6j6cQmjqGwJ9XoSacMB1UBhPsOIUkzSZuCxJbCOMtwhLYO0AUoC8wb97BDVKAYKrVv0c2q1Mh6IX03tiew4L2AMirsgOAYK4AReYgWOEQWRU9jvzbfLkBVW1TeCKBiD/P6KlaYsx/ISIzOiIMkK+32IjwGBQyrg4foPEycUxQPr75iHEjGiEOcNUIC2GoXVE2MYyyM/tUrTVI1U1VIVfPb4YZY3MW51vDbt8jLtH6o+kc5Zd3g6oeImcrPWPD6F6U0z1yxJ2cn08R+SAAWcjlKsl9wxj+ItK3oRA2dpVpaHc+6qQmyl682Izir3TCp2ilGY2Zyx5C6hHGQ+TqDfN7S13SJwrsVotGGvkl/ppj44awxi1OEI/VrsBTp8Vl7C6qkxrL2zuK1M252LBHo9lBK2Xnu3IljCw3ka7JJ18jxd4Nth1NyMJJnwGr2NHmxHdXf1LEh77mTK5vwQ6embje9jlL+vL3w32KDe8JtgdN8G70L8l5pvuAfPMa/jX1K8r5d/GdFZJE687Hi2HKsTIzISywPXC4uqGdH0kJU9F1iXDNOQ38QP4PX1rzGockiTsi6AAiCJ6/JulrpsBxMvSVL+ppimMktNTbWh8Rw2VP0cDB8XqKGwqIDCSqIkCtxEYt9eOXVZLWCTAQU4LydhNpi8V6vKo5B+jBlQh+8p9sDr372Asx+CBwAA", 
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
