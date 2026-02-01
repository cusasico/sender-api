const fs = require('fs'), 
      axios = require('axios'), 
      path = require('path'),
      zlib = require('zlib'),
      pino = require('pino'),
      config = require('../config'),
      sessionDir = path.join(__dirname, "session"),
      sessionPath = path.join(sessionDir, "creds.json"),
      { getContentType, isJidBroadcast, jidNormalizedUser } = require('gifted-baileys');


async function loadSession() {
    try {
        if (fs.existsSync(sessionPath)) {
            fs.unlinkSync(sessionPath);
            console.log("♻️ ᴏʟᴅ ꜱᴇꜱꜱɪᴏɴ ʀᴇᴍᴏᴠᴇᴅ");
        }

        if (!config.SESSION_ID || typeof config.SESSION_ID !== 'string') {
            throw new Error("❌ SESSION_ID is missing or invalid");
        }

        const [header, b64data] = config.SESSION_ID.split('~');

        if (header !== "Gifted" || !b64data) {
            throw new Error("❌ Invalid session format. Expected 'Gifted~.....'");
        }

        const cleanB64 = b64data.replace('...', '');
        const compressedData = Buffer.from(cleanB64, 'base64');
        const decompressedData = zlib.gunzipSync(compressedData);

        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        fs.writeFileSync(sessionPath, decompressedData, "utf8");
        console.log("✅ ɴᴇᴡ ꜱᴇꜱꜱɪᴏɴ ʟᴏᴀᴅᴇᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ");

    } catch (e) {
        console.error("❌ Session Error:", e.message);
        throw e;
    }
}

function saveMessage(message) {
    try {
        const logPath = path.join(__dirname, 'message_log.json');
        const logData = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath)) : [];
        logData.push({ timestamp: new Date().toISOString(), message });
        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    } catch (error) {
        console.error('Error saving message:', error);
    }
}

async function handleIncomingMessages(mek) {
    try {
        mek = mek.messages[0];
        saveMessage(JSON.parse(JSON.stringify(mek, null, 2)));
        const fromJid = mek.key.participant || mek.key.remoteJid;

        if (!mek || !mek.message) return;

        mek.message = getContentType(mek.message) === 'ephemeralMessage' 
            ? mek.message.ephemeralMessage.message 
            : mek.message;

        // Handle presence updates
        if (fromJid) {
            if (config.PRESENCE === "typing") await global.Gifted.sendPresenceUpdate("composing", fromJid);
            if (config.PRESENCE === "recording") await global.Gifted.sendPresenceUpdate("recording", fromJid);
            if (config.PRESENCE === "online") await global.Gifted.sendPresenceUpdate('available', fromJid);
            else await global.Gifted.sendPresenceUpdate('unavailable', fromJid);
            
            if (config.AUTO_READ_MESSAGES === "true") await global.Gifted.readMessages([mek.key]);
        }

        if (mek.key && isJidBroadcast(mek.key.remoteJid)) {
            if (config.AUTO_READ_STATUS === "true" && mek.key) {
                const giftedtech = jidNormalizedUser(global.Gifted.user.id);
                await global.Gifted.readMessages([mek.key]);
            }

            if (config.AUTO_LIKE_STATUS === "true") {
                const giftedtech = jidNormalizedUser(global.Gifted.user.id);
                const emojis = config.AUTO_LIKE_EMOJIS.split(','); 
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]; 
                if (mek.key.remoteJid && mek.key.participant) {
                    await global.Gifted.sendMessage(
                        mek.key.remoteJid,
                        { react: { text: randomEmoji, key: mek.key } }
                    );
                }
            }
        }
    } catch (error) {
        console.error("Error Processing Message:", error);
    }
}

const logger = pino({ level: "silent" });

async function handleMediaMessage({ mediaUrl, name, caption }, jid) {
    try {
        const mimeMap = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4',
            mov: 'video/quicktime', webm: 'video/webm', avi: 'video/x-msvideo',
            mkv: 'video/x-matroska', mp3: 'audio/mpeg', ogg: 'audio/ogg',
            wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac',
            pdf: 'application/pdf', zip: 'application/zip',
            rar: 'application/x-rar-compressed', '7z': 'application/x-7z-compressed',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            txt: 'text/plain', csv: 'text/csv', json: 'application/json',
            apk: 'application/vnd.android.package-archive'
        };

        let mimeType = null;
        
        try {
            const response = await axios.head(mediaUrl, { timeout: 5000 });
            const contentType = response.headers['content-type']?.split(';')[0];
            if (contentType && contentType !== 'application/octet-stream') {
                mimeType = contentType;
            }
        } catch (err) {
            console.warn('⚠️ Header detection failed, trying URL extension...');
        }

        if (!mimeType) {
            const urlPath = new URL(mediaUrl).pathname;
            const urlExt = urlPath.split('.').pop()?.toLowerCase();
            if (urlExt && mimeMap[urlExt]) {
                mimeType = mimeMap[urlExt];
            }
        }

        if (!mimeType && name && name.includes('.')) {
            const ext = name.split('.').pop().toLowerCase();
            if (mimeMap[ext]) {
                mimeType = mimeMap[ext];
            }
        }

        if (!mimeType) {
            mimeType = 'application/octet-stream';
            console.warn('⚠️ Could not detect MIME type, defaulting to binary');
        }

        let finalFilename = name;
        if (!finalFilename) {
            try {
                const urlPath = new URL(mediaUrl).pathname;
                const urlFilename = urlPath.split('/').pop();
                if (urlFilename && urlFilename.includes('.')) {
                    finalFilename = urlFilename;
                }
            } catch (e) {}
        }
        if (!finalFilename) {
            const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
            finalFilename = `file.${ext}`;
        } else if (!finalFilename.includes('.')) {
            const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
            finalFilename = `${finalFilename}.${ext}`;
        }

        let result;

        if (mimeType.startsWith('image/')) {
            result = await global.Gifted.sendMessage(jid, { 
                image: { url: mediaUrl }, 
                fileName: finalFilename, 
                caption,
                mimetype: mimeType 
            });
        } else if (mimeType.startsWith('video/')) {
            result = await global.Gifted.sendMessage(jid, { 
                video: { url: mediaUrl }, 
                fileName: finalFilename, 
                caption,
                mimetype: mimeType 
            });
        } else if (mimeType.startsWith('audio/')) {
            result = await global.Gifted.sendMessage(jid, { 
                audio: { url: mediaUrl }, 
                fileName: finalFilename, 
                caption,
                mimetype: mimeType 
            });
        } else {
            result = await global.Gifted.sendMessage(jid, { 
                document: { url: mediaUrl }, 
                fileName: finalFilename, 
                caption,
                mimetype: mimeType 
            });
        }

        return result;
    } catch (error) {
        console.error('❌ Error handling media message:', error);
        throw error;
    }
}

class CustomStore {
    constructor() {
        this.messages = new Map();
        this.contacts = new Map();
        this.chats = new Map();
        this.maxMessages = 10000;
        this.maxChats = 5000;
        this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    }

    loadMessage(jid, id) {
        const chatMessages = this.messages.get(jid);
        return chatMessages?.get(id) || null;
    }

    saveMessage(jid, message) {
        if (!this.messages.has(jid)) {
            this.messages.set(jid, new Map());
        }
        
        const chatMessages = this.messages.get(jid);
        chatMessages.set(message.key.id, message);
        
        if (chatMessages.size > this.maxMessages) {
            const firstKey = chatMessages.keys().next().value;
            chatMessages.delete(firstKey);
        }
    }

    cleanup() {
        try {
            if (this.messages.size > this.maxChats) {
                const chatsToDelete = this.messages.size - this.maxChats;
                const oldestChats = Array.from(this.messages.keys()).slice(0, chatsToDelete);
                oldestChats.forEach(jid => this.messages.delete(jid));
            }
            
            console.log(`🧹 Store cleanup: ${this.messages.size} chats in memory`);
        } catch (error) {
            console.error('Store cleanup error:', error);
        }
    }

    bind(ev) {
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key?.remoteJid && msg.key?.id) {
                    this.saveMessage(msg.key.remoteJid, msg);
                }
            });
        });

        ev.on('chats.set', ({ chats }) => {
            chats.forEach(chat => {
                this.chats.set(chat.id, chat);
            });
        });

        ev.on('contacts.set', ({ contacts }) => {
            contacts.forEach(contact => {
                this.contacts.set(contact.id, contact);
            });
        });
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.messages.clear();
        this.contacts.clear();
        this.chats.clear();
    }
}



module.exports = { loadSession, CustomStore, logger, handleIncomingMessages, saveMessage, handleMediaMessage };
