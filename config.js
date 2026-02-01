const fs = require('fs'), 
      dotenv = fs.existsSync('config.env') ? require('dotenv').config({ path: '/.env' }) : undefined,
      convertToBool = (text, fault = 'true') => text === fault; 

module.exports = {
SESSION_ID: process.env.SESSION_ID || "Gifted~H4sIAAAAAAAAA5VU25KiOhT9l7xqDXdQqrpqEO+KIHhpPTUPASJEuZkEEKf891PY3dPzcM6cPm/JTrLX2muvnZ8gyzFFC9QA/ScoCK4gQ+2SNQUCOhiUpxMioAtCyCDQwXXAub1QHFsMem4D0XjLh74pumt+3jm8aho3WZuXK7zEF+MFPLqgKP0EB39IGE1dEdnF1UMs3dPxNTjEvHbfOfnGH4yisbO9ZQHZXBc8f3gBjzYjxARn0aiIUYoITBaocSAmX6N/cOa1YRyKvTN11pKhzn1bnRZsIl/v53SGtSs1zuFBs/hU/hr9iYXXOEK57x6lveA1q/wKl5fdnqfhYLXFS9oxNoNOWS3v9I0+xVGGwlmIMoZZ82Xd7WFoLsXj1NkVhw7nx2gAleVwcUvn6rU3oJFwTmC1UpJtUn+NeDCNbiVEh6yc8FFuzl/jTNjuHSWpMicwLJtoqUtSv5dLwe/EHfLhlcv/0X099TrKZmF3UiUv5NV+cfVV13XVTd33g9LZaNHqfO6HHNqNvka/37fobXWsbsObS4fDlYlCeyyvj6/aRa7VNEs5FA4G9Ly5G5/0ISvJn1guJX7vh0l26pHKdV+5vio1culPzPsRj5cbY2Ks7JM0EDhhWYXFup45+z0aTY0x8w7xfXgYanWU22hB4FHihV1vX/KOuX55VnRBzSwEuvDoAoIiTBmBDOfZMyb3uwCGlYcCgthTXuBeL4fV5Iwn28rMkoydhm5wotaEy1kjy7KcHzxlJvob24peQBcUJA8QpSicYspy0liIUhghCvS/fnRBhm7srXEtnCR0wQkTyrZZWSQ5DD+6+nEIgyAvM+Y1WWC2C0SAzn+GEWM4i2irY5lBEsS4QmYMGQX6CSYU/aoQERS+x369bl+FiEGcUKADc2EfiyU/Gtm2x1l0MjFGkWFGBvhE+2jbmyx3Ei4mdl73Gq5oTto1rvzlBaV3VRyUk/PyGN3NyULIIkHqvfxDEqADrfJMqVrbTNQiNLMVjy1fj83IndeGeJ8h6TTk/UAStokTs3qQG4KWDDevZIQ4cVSKBd2LIpVkma8Ub6csbM3qWD3TeGnRQlThAP0O5q3q5HYbo4XJ9X0cXriSDztXO+b9nrfKqLnbTd3TRiDHZDE91pmH6PmeiGdv4Vj92IJzQubJrZkeCq62RzNUlEkuDt8NlT6djEOgA1GRNUEReVVRRV3+Tr/VbTtgUXzLEANdkDxvCVpPEAVZ4/u8qmh9Xf7exj9GI3n/kvDTNG3idnvC6DnhGWzh/hPoTYHWR/yj+1uK9y/jX8ZuEKiSF5+vlmNVapB11NwXG2Va0A6L/DhvxINVx5gd5VXIgcfjRxcUCWSnnKRABzALSY5D0AUkL1tjzrJT/gcw0+BnphGZbeEJpMz4NPsGp4gymBZAFzS135ckQePfbjkkL6aQxkAHzv6iDMDjb11DffE5BwAA", 
AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",
AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || "true",
THUMBNAIL: process.env.THUMBNAIL || "https://files.giftedtech.co.ke/image/R6uYwasender-api.png",
API_URL: process.env.API_URL || "https://whatsapp.giftedtech.co.ke", // Fill in this after deploying and only if you tend to use api for other functions such as whatsapp notifications
AUTO_LIKE_EMOJIS: process.env.AUTO_LIKE_EMOJIS || "💛,❤️,💜,🤍,💙", // Can be one Emoji or Multiple Emojis Separated by Commas
MODE: process.env.MODE || "private", // Put private or public or inbox or groups
AUTO_READ_MESSAGES: process.env.AUTO_READ_MESSAGES || "true",
FOOTER : process.env.FOOTER || 'ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɢɪғᴛᴇᴅ ᴛᴇᴄʜ',
NEWSLETTER_JID: process.env.NEWSLETTER_JID || "120363403054496228@newsletter",
NEWSLETTER_URL: process.env.NEWSLETTER_URL || "https://whatsapp.com/channel/0029Vb6lNd511ulWbxu1cT3A",
PRESENCE: process.env.PRESENCE || "typing", // Choose one: typing, recording, online, null
TIME_ZONE: process.env.TIME_ZONE || "Africa/Nairobi", // Enter yours else leave blank if not sure
};

let file = require.resolve(__filename); 
fs.watchFile(file, () => { fs.unwatchFile(file); console.log(`Update '${__filename}'`); delete require.cache[file]; require(file); });
