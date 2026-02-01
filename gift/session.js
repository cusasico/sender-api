const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const config = require('../config');

const SESSION_DIR = path.join(__dirname, 'session');
const SESSION_PATH = path.join(SESSION_DIR, 'creds.json');

function ensureSessionDirectory() {
    if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
    }
}

function clearOldSession() {
    if (fs.existsSync(SESSION_PATH)) {
        fs.unlinkSync(SESSION_PATH);
        console.log('♻️ Old session removed');
        return true;
    }
    return false;
}

function validateSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('SESSION_ID is missing or invalid');
    }

    const [header, b64data] = sessionId.split('~');

    if (header !== 'Gifted' || !b64data) {
        throw new Error("Invalid session format. Expected 'Gifted~.....'");
    }

    return b64data;
}

function decodeSession(b64data) {
    const cleanB64 = b64data.replace('...', '');
    const compressedData = Buffer.from(cleanB64, 'base64');
    return zlib.gunzipSync(compressedData);
}

async function loadSession() {
    try {
        clearOldSession();

        const b64data = validateSessionId(config.SESSION_ID);
        const decompressedData = decodeSession(b64data);

        ensureSessionDirectory();
        fs.writeFileSync(SESSION_PATH, decompressedData, 'utf8');
        
        console.log('✅ New session loaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Session Error:', error.message);
        throw error;
    }
}

function getSessionDir() {
    return SESSION_DIR;
}

module.exports = {
    loadSession,
    getSessionDir,
    ensureSessionDirectory,
    SESSION_DIR,
    SESSION_PATH
};
