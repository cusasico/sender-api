const fs = require('fs'), 
      dotenv = fs.existsSync('config.env') ? require('dotenv').config({ path: '/.env' }) : undefined,
      convertToBool = (text, fault = 'true') => text === fault;

module.exports = {
SESSION_ID: process.env.SESSION_ID || "Gifted~H4sIAAAAAAAAA5VU25KiSBD9l3rFGOUqGNERi0ADXlrESwsb+1BACSX3olBxwn/fwB5n+mF3tpenoioj8+TJc/I7KErcoDnqwOQ7qAg+Q4r6I+0qBCZg2h6PiIABiCCFYAI4w5hdSX7Ge1NRfeUyvMVaDav0YA1vrzM7nSVqaPk+FdLmBdwHoGqDDIe/SRjPdM5z33YeZLtNoh2qLC9m9CzuFIERh9qVLW3OZI6FcFJfwL3PCDHBRWxUCcoRgdkcdQ7E5Gvw54Z92AgwldnEp970oA9XGn/tuqurXPVcapvOnS6cUbfh5a/Bd0O3zfTLSuKckf/qxPVMZpnpaWvsYKK9CymjBWIzIis52X3Ab3BcoMiOUEEx7b7Mez4Ljvb8sqgKfsftK5W4u2wDM7odhgxH6oVoKoWs2ic+M74GHEI/WHgnRbSG1mlLJB1HEZFf3Wh4I6OlJYRcU48PQdkl3mfgDnlqJf0/vLfL1g/U1DKtfKeY7liTTq4V2wsuSk6qebpImbpgbwc0N8qvwc/r02bU7q+inpnO62W3ns6VjhEjV1knw+22fDfWaek4ZX77xDukLfkdSqqbbzQO/HFG1vuMm2t7fzPlxkG7qRfeShovFO9qvNkBswnbM7U9wgnrZa4rmO6FkRVtx4nNYSWkO2hAL7G3Un5l1Pjl0VGKOjsCE/Y+AATFuKEEUlwWjzuWGwAYnTcoJIg+6AWmtDaEMtqFTPAWh56fnvnp3g4imdqWneFlWQytE7bKc7d+AQNQkTJETYMiCze0JN0SNQ2MUQMmf/41AAW60o/B9eV4dgCOmDR0V7RVVsLoOdXnIwzDsi3opitCrT8gAiajX9eIUlzETc9jW0ASJviMtATSBkyOMGvQzw4RQRGYUNKin67Vyqgn3rE088CtVTAA+WMgOOp3iyiMJW7ESoo4nsjyH823S58WVtW3AlEwANkjjFVGssxKvMCJI5mX+sj+4f4TYZ8wQhTirAEToM2KZearmrEa41uzNE01jlUt7ms/O3pK44N6Yz/W340uO4sl3iuxX1fTecC31eXtYpgaubU3J53bUvT+rr78QxIwAeOgLpgk8IOmSfVao8hQmFTTuss1dPfMKQ00YytaeZxnNVtvTsU2uVihzujHfWvv/M5DtF0V1+Vw2eYjXkoMR9X5aa+jAYjQGYfoczEKHeccuPWq42ezRbDwVnM9WEZKfCkaZ9vW777chs4yCg6pqE21OY9Wp7jg28zcHGYhv3ft0yIwotc3b3Q972+5XEXmU7QP02Q/lhV+yKmfVf97xOjh/QL2E/zv2X0A7yU2ug8+5fixTf7FkVP3FV3YZFkFDLSzo2fCer3JlXEd6uF0GtfyuLmJGl4V+ywG9/tfA1BlkB5LkvcrrohIiSMwAKRse83axbH8TTFN3dnGj84z2FD1lw+2OEcNhXkFJuxY5ASWE3npI8ohZWXBJumVORcSS+hF3alVtaGQPm0F1P7TdRXc/waL2jsacgcAAA==", 
AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true",
AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || "true",
THUMBNAIL: process.env.THUMBNAIL || "https://files.giftedtech.web.id/file/gifted-md.jpg",
API_URL: process.env.API_URL || "https://whatsapp.giftedtech.co.ke", // Fill in this after deploying and only if you tend to use api for other functions such as whatsapp notifications
AUTO_LIKE_EMOJIS: process.env.AUTO_LIKE_EMOJIS || "💛,❤️,💜,🤍,💙", // Can be one Emoji or Multiple Emojis Separated by Commas
MODE: process.env.MODE || "private", // Put private or public or inbox or groups
AUTO_READ_MESSAGES: process.env.AUTO_READ_MESSAGES || "true",
PRESENCE: process.env.PRESENCE || "typing", // Choose one: typing, recording, online, null
TIME_ZONE: process.env.TIME_ZONE || "Africa/Nairobi", // Enter yours else leave blank if not sure
};

let file = require.resolve(__filename); 
fs.watchFile(file, () => { fs.unwatchFile(file); console.log(`Update '${__filename}'`); delete require.cache[file]; require(file); });
