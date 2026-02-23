const fs = require('fs'), 
      dotenv = fs.existsSync('config.env') ? require('dotenv').config({ path: '/.env' }) : undefined,
      convertToBool = (text, fault = 'true') => text === fault; 

module.exports = {
SESSION_ID: process.env.SESSION_ID || "Gifted~H4sIAAAAAAAAA5VU25KiSBD9lY161RgFuUd0xCCiooJ4Q3RjH0oosAShLAoEJ/rfN7C7p+dhd7aXpyKrIvPkOSfzB8hyXKA5aoD2AxCKK8hQe2QNQUADwzKKEAVdEEIGgQY69mAuPzxmWYm/OIqrmPKZ46a+0nHWhwWn9Lypsh5Kln1dvYDXLiDlKcXBbxJG5030SDJxLIdrf3Fd3JLkwS+iaaD28KRDD5xqqb04Dsrm8AJe24wQU5zFJjmjK6IwnaPGhZh+Df7BPTmWcJpEMzN3B+W5fhx7zuXoxYEzV927cR6dwrAcBXw/+Bp8PzjutwdutGu2w/HVyZSJzVK4H/NCvUJ8rUBeLCSJG7hN/ga/wHGGQitEGcOs+TLvkp1JVERzNln3KsZoZ8LPoLiu8uPKirylbl7GbDYeiqfki8CD3dmxZmM69ETdlCSZ3vl5tZa3TeDOBo1pOtluf5Eb9LgIvwJ36YdXkv/De2CS8U7KLpVPZpmq+uMYcu5ibVcnwps0T4KAIZRvGJ0KX4O/XCZ+TOrEnK9V2RFE38NuQwWULqZOfF+tNtOHysfsBC/KJ3zISvo7lLKEJnCZe4pQDxpVPRjDRRXdHVeZmEY/zlLo3oPYjldcOowFlEABFcvJqMPLvFQIzWhmHM+lhx5ZZe245dxwgmqQG/rLs6MENVYINO61CyiKccEoZDjPnjGR6wIYVhsUUMSe9IIyTUzGggfa8gJuILG9Wp34fb//6MgkvaBrufGktd2Zr4QX0AWE5gEqChROccFy2tioKGCMCqD9+VcXZKhmb8K15QZcF0SYFmyXlSTNYfih6sclDIK8zNimyQKjPSAKtP5nGDGGs7hoeSwzSIMzrpBxhqwAWgTTAv3sEFEUAo3REv2cWiMPW+IHq/XssN3tQRdcn4LgEGiAFwWZE/m+JEq8Jn4vvt3brJCQbxlioAvS5ytOVjieE+S+2pdEWdXE7228CzLYpgJ7WKAsRPQPneCW93fUbZEQMYjTAmjAsJZ1rBYT08aOotwnE92MdSPWwWeXH3Z5k6M69N3Uz8Logaf7dAZLqe7j6zVAVlxva9E45m5Rqo/7ZGO//EMSoIHew6c5S65eY9ytoy6GdtM/NwPOlcubLU9X5wey+ZoFi+ltdxsmrM8dovS8Wnhyn4vqS3SuMSPkQBqKjJ6/qMe7Uam33uqCEFU4QL8W0+XR8jamh1lnmenCsmBSb9obVYS/oSC2fe80uc0M4WYRZ03v69zHB5cw3dve74P1OVwQ1b1tufH9aFAsn1SSH2LTNFZvRn4OUvq+wPDTYq1+7W+E0XMfvEvxX3q+4W5d13/t/pLifcH8y5AOT7wzEj1x4CvCmSObPS2L0CIkm2LL3ilodYUjeVEFyjC5gNfXv7qApJBFOb0CDcAspPnTLjQvWxtbWZT/ppih25ahx7O28RQWTP8cjS2+ooLBKwEaJ8ucovCcKr69cmlOprA4Aw24+0QctjZvdEI2DLKPQQN6+y3jB3j9G//U/6aEBwAA", 
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
