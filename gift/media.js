const axios = require('axios');

const MIME_MAP = {
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

async function detectMimeFromHeaders(mediaUrl, timeout = 5000) {
    try {
        const response = await axios.head(mediaUrl, { timeout });
        const contentType = response.headers['content-type']?.split(';')[0];
        if (contentType && contentType !== 'application/octet-stream') {
            return contentType;
        }
    } catch (err) {
        console.warn('⚠️ Header detection failed, trying URL extension...');
    }
    return null;
}

function detectMimeFromUrl(mediaUrl) {
    try {
        const urlPath = new URL(mediaUrl).pathname;
        const urlExt = urlPath.split('.').pop()?.toLowerCase();
        if (urlExt && MIME_MAP[urlExt]) {
            return MIME_MAP[urlExt];
        }
    } catch {
        return null;
    }
    return null;
}

function detectMimeFromFilename(filename) {
    if (filename && filename.includes('.')) {
        const ext = filename.split('.').pop().toLowerCase();
        if (MIME_MAP[ext]) {
            return MIME_MAP[ext];
        }
    }
    return null;
}

async function detectMimeType(mediaUrl, filename) {
    let mimeType = await detectMimeFromHeaders(mediaUrl);
    
    if (!mimeType) {
        mimeType = detectMimeFromUrl(mediaUrl);
    }
    
    if (!mimeType && filename) {
        mimeType = detectMimeFromFilename(filename);
    }
    
    if (!mimeType) {
        mimeType = 'application/octet-stream';
        console.warn('⚠️ Could not detect MIME type, defaulting to binary');
    }
    
    return mimeType;
}

function generateFilename(mediaUrl, providedName, mimeType) {
    let finalFilename = providedName;
    
    if (!finalFilename) {
        try {
            const urlPath = new URL(mediaUrl).pathname;
            const urlFilename = urlPath.split('/').pop();
            if (urlFilename && urlFilename.includes('.')) {
                finalFilename = urlFilename;
            }
        } catch {}
    }
    
    if (!finalFilename) {
        const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
        finalFilename = `file.${ext}`;
    } else if (!finalFilename.includes('.')) {
        const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
        finalFilename = `${finalFilename}.${ext}`;
    }
    
    return finalFilename;
}

function getMediaType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
}

async function handleMediaMessage({ mediaUrl, name, caption }, jid, client) {
    if (!client) {
        client = global.Gifted;
    }
    
    if (!client) {
        throw new Error('WhatsApp client not initialized');
    }

    const mimeType = await detectMimeType(mediaUrl, name);
    const finalFilename = generateFilename(mediaUrl, name, mimeType);
    const mediaType = getMediaType(mimeType);

    const messagePayload = {
        [mediaType]: { url: mediaUrl },
        fileName: finalFilename,
        caption,
        mimetype: mimeType
    };

    return await client.sendMessage(jid, messagePayload);
}

module.exports = {
    handleMediaMessage,
    detectMimeType,
    generateFilename,
    getMediaType,
    MIME_MAP
};
