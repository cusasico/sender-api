const {
  default: giftedConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion,
  Browsers,
  generateWAMessageFromContent, 
  proto, 
  normalizeMessageContent,
  makeCacheableSignalKeyStore
} = require('gifted-baileys');
const { sendButtons } = require('gifted-btns');

const express = require('express'),
      fs = require('fs'),
      path = require('path'),
      axios = require('axios'),
      config = require('./config'),
      { THUMBNAIL: thumbnailUrl,
        NEWSLETTER_JID: newsletterJid,
        NEWSLETTER_URL: newsletterUrl,
        FOOTER: botFooter } = config,
      { loadSession, CustomStore, logger, handleIncomingMessages, saveMessage, handleMediaMessage } = require('./gift');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const sessionDir = path.join(__dirname, "gift", "session");

loadSession();

let store;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;
const INITIAL_RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_INTERVAL = 60000;
const CONNECTION_TIMEOUT = 90000;

let connectionMessageSent = false;
let connectionReady = false;
let connectionLock = false;

global.Gifted = null;

let connectionTimeout;
let reconnectTimeout;

function clearConnectionTimers() {
    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
    }
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
}

function getReconnectInterval() {
    const interval = Math.min(
        INITIAL_RECONNECT_INTERVAL * Math.pow(1.5, reconnectAttempts),
        MAX_RECONNECT_INTERVAL
    );
    return interval + Math.random() * 1000;
}

function handleReconnection() {
    if (connectionLock) {
        console.log('🔒 Connection lock active, skipping reconnection');
        return;
    }
    
    isConnecting = false;
    connectionReady = false;
    reconnectAttempts++;
    
    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        const interval = getReconnectInterval();
        console.log(`♻️ Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${Math.round(interval/1000)}s`);
        reconnectTimeout = setTimeout(() => {
            startGifted();
        }, interval);
    } else {
        console.error('❌ Max reconnection attempts reached. Resetting counter and waiting 5 minutes...');
        reconnectAttempts = 0;
        reconnectTimeout = setTimeout(() => {
            startGifted();
        }, 300000);
    }
}

function isConnectionReady() {
    return connectionReady && global.Gifted && global.Gifted.user && global.Gifted.ws?.readyState === 1;
}

async function waitForConnection(timeout = 30000) {
    const startTime = Date.now();
    while (!isConnectionReady()) {
        if (Date.now() - startTime > timeout) {
            return false;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return true;
}

async function startGifted() {
    if (isConnecting || connectionLock) {
        console.log('⏳ Already connecting or locked, skipping...');
        return;
    }
    
    connectionLock = true;
    isConnecting = true;
    connectionReady = false;
    clearConnectionTimers();
    connectionMessageSent = false;

    try {
        console.log('⏱️ Connecting Gifted MD...');
        const { version, isLatest } = await fetchLatestWaWebVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        if (store) {
            store.destroy();
        }
        store = new CustomStore();

        const giftedSock = {
            version,
            logger: logger,
            browser: ['Ubuntu', 'Chrome', '22.04.4'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Error occurred' };
            },
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 30000,
            fireInitQueries: true,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            retryRequestDelayMs: 250,
            maxMsgRetryCount: 5,
            generateHighQualityLinkPreview: false,
            emitOwnEvents: true,
            qrTimeout: 60000,
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
                }
                return message;
            }
        };

        connectionTimeout = setTimeout(() => {
            if (!connectionReady) {
                console.log('⌛ Connection timeout. Attempting to reconnect...');
                connectionLock = false;
                handleReconnection();
            }
        }, CONNECTION_TIMEOUT);

        global.Gifted = giftedConnect(giftedSock);
        store.bind(global.Gifted.ev);

        global.Gifted.ev.on('creds.update', saveCreds);

        global.Gifted.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('🔑 QR Code Generated - Scan to Connect');
                clearTimeout(connectionTimeout);
                connectionMessageSent = false;
                connectionReady = false;
            }

            if (connection === 'close') {
                connectionReady = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(`🔌 Connection Closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
                connectionMessageSent = false;
                connectionLock = false;
                
                if (shouldReconnect) {
                    handleReconnection();
                } else {
                    console.log('❌ Logged out. Please update SESSION_ID and restart.');
                    isConnecting = false;
                    reconnectAttempts = 0;
                }
            } else if (connection === 'connecting') {
                console.log('🔄 Connecting...');
            } else if (connection === 'open') {
                console.log('✅ Connected to WhatsApp');
                clearConnectionTimers();
                reconnectAttempts = 0;
                isConnecting = false;
                connectionLock = false;
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                connectionReady = true;
                
                if (!connectionMessageSent) {
                    try {
                        await sendConnectionMessage();
                        connectionMessageSent = true;
                    } catch (err) {
                        console.error('Error sending connection message:', err.message);
                    }
                }
            }
        });

        global.Gifted.ev.on('messages.upsert', handleIncomingMessages);
        
        global.Gifted.ev.on('error', (error) => {
            console.error('⚠️ WhatsApp Connection Error:', error.message);
        });

    } catch (error) {
        console.error('❌ Initial Connection Error:', error.message);
        connectionLock = false;
        handleReconnection();
    }
}

async function sendConnectionMessage() {
    if (!isConnectionReady()) {
        console.log('⚠️ Connection not ready for sending message');
        return;
    }
    
    const startMess = {
        image: { url: thumbnailUrl },
        caption: `
*WHATSAPP INSTANCE IS ONLINE*

> *Settings:*
Mode                      : *${config.MODE}*
Auto_View Status     : *${config.AUTO_READ_STATUS}*
Auto-Like Status     : *${config.AUTO_LIKE_STATUS}*

> *Access the Api at:*
> *${config.API_URL}/api/sendMessage.php*
> *Method: POST*`,
        contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: newsletterJid,
                newsletterName: "GIFTED-TECH",
                serverMessageId: 143
            }
        }
    };
    
    try {
        await global.Gifted.sendMessage(global.Gifted.user.id, startMess);
    } catch (error) {
        console.error('Error sending connection message:', error.message);
    }
}

async function sendWithRetry(sendFn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (!isConnectionReady()) {
            console.log(`⏳ Waiting for connection (attempt ${attempt})...`);
            const ready = await waitForConnection(15000);
            if (!ready) {
                if (attempt === maxRetries) {
                    throw new Error('Connection not ready after waiting');
                }
                continue;
            }
        }
        
        try {
            return await sendFn();
        } catch (error) {
            const isConnectionError = 
                error.message?.includes('Connection Closed') ||
                error.output?.statusCode === 428 ||
                error.message?.includes('not open');
                
            if (isConnectionError && attempt < maxRetries) {
                console.log(`⚠️ Connection error on attempt ${attempt}, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                continue;
            }
            throw error;
        }
    }
}

app.post('/api/sendMessage.php', async (req, res) => {
    if (!isConnectionReady()) {
        const ready = await waitForConnection(10000);
        if (!ready) {
            return res.status(503).json({ 
                status: 503,
                success: 'false',
                creator: 'GiftedTech',
                error: 'WhatsApp Instance is Not Ready Yet or Disconnected' 
            });
        }
    }

    const { number, message, username, code, type, mediaUrl, mediaType, filename, caption } = req.body;
    
    const codeTypes = ['sendSignupCode', 'sendResetCode', 'sendResendCode', 'sendDeleteCode'];
    const isCodeType = codeTypes.includes(type);
    
    if (!number) {
        return res.status(400).json({ 
            status: 400,
            success: 'false',
            creator: 'GiftedTech',
            error: 'Number is a required field' 
        });
    }
    
    if (isCodeType && (!username || !code)) {
        return res.status(400).json({ 
            status: 400,
            success: 'false',
            creator: 'GiftedTech',
            error: 'Username and code are required for verification code messages' 
        });
    }
    
    if (!isCodeType && type !== 'media' && !message) {
        return res.status(400).json({ 
            status: 400,
            success: 'false',
            creator: 'GiftedTech',
            error: 'Message is required for text messages' 
        });
    }

    try {
        const numbers = number.split(',').map(num => num.trim());
        const results = [];
        
        for (const num of numbers) {
            const jid = num.includes('@s.whatsapp.net') ? num : num + '@s.whatsapp.net';
            
            try {
                if (type === 'sendSignupCode') {
                    await sendWithRetry(async () => {
                        await sendButtons(global.Gifted, jid, {
                            title: '',            
                            text: `Hello *${username},*\nThank you for signing up. To complete your registration, please copy your verification code.\nThe code will expire in *10 minutes.*\nIf you didn't request this signup, please ignore this message or contact our support team.\n`,    
                            footer: `> *${botFooter}*`,            
                            buttons: [ 
                                { name: 'cta_copy', 
                                  buttonParamsJson: JSON.stringify({ 
                                    display_text: 'Copy', 
                                    copy_code: code }) },
                                {
                                  name: 'cta_url',
                                  buttonParamsJson: JSON.stringify({
                                    display_text: 'WaChannel',
                                    url: newsletterUrl
                                  })
                                }
                            ]
                        });
                    });
                    results.push({ jid, status: 'success' });
                } else if (type === 'sendResetCode') {
                    await sendWithRetry(async () => {
                        await sendButtons(global.Gifted, jid, {
                            title: '',            
                            text: `Hello *${username},*\nWe have received a request to reset your account password, please copy your verification code.\n⚠️ If you didn't request this password reset, please secure your account immediately as someone else may be trying to access it.\nThe code will expire in *10 minutes.*\n> *Security Tip:* Never share your verification code with anyone\n`,    
                            footer: `> *${botFooter}*`,            
                            buttons: [ 
                                { name: 'cta_copy', 
                                  buttonParamsJson: JSON.stringify({ 
                                    display_text: 'Copy', 
                                    copy_code: code }) },
                                {
                                  name: 'cta_url',
                                  buttonParamsJson: JSON.stringify({
                                    display_text: 'WaChannel',
                                    url: newsletterUrl
                                  })
                                }
                            ]
                        });
                    });
                    results.push({ jid, status: 'success' });
                } else if (type === 'sendResendCode') {
                    await sendWithRetry(async () => {
                        await sendButtons(global.Gifted, jid, {
                            title: '',            
                            text: `Hello *${username},*\nWe've received a request to resend a new verification code, please copy your verification code.\nThe code will expire in *10 minutes.*\n> *Security Tip:* Never share your verification code with anyone\n`,
                            footer: `> *${botFooter}*`,
                            buttons: [ 
                                { name: 'cta_copy', 
                                  buttonParamsJson: JSON.stringify({ 
                                    display_text: 'Copy', 
                                    copy_code: code }) },
                                {
                                  name: 'cta_url',
                                  buttonParamsJson: JSON.stringify({
                                    display_text: 'WaChannel',
                                    url: newsletterUrl
                                  })
                                }
                            ]
                        });
                    });
                    results.push({ jid, status: 'success' });
                } else if (type === 'sendDeleteCode') {
                    await sendWithRetry(async () => {
                        await sendButtons(global.Gifted, jid, {
                            title: '',            
                            text: `Hello *${username},*\nWe received a request to permanently delete your account.\nPlease review the following information carefully:\n> *⚠️ Important:*\nThis action will immediately and permanently:\n- Delete all your account data\n- Remove your access to all services\n- Cancel any active subscriptions\n\nThis action cannot be undone\n\nTo confirm this deletion, please copy your verification code.\nThe code will expire in *10 minutes.*\n> *Security Tip:* Never share your verification code with anyone\n`,
                            footer: `> *${botFooter}*`,
                            buttons: [ 
                                { name: 'cta_copy', 
                                  buttonParamsJson: JSON.stringify({ 
                                    display_text: 'Copy', 
                                    copy_code: code }) },
                                {
                                  name: 'cta_url',
                                  buttonParamsJson: JSON.stringify({
                                    display_text: 'WaChannel',
                                    url: newsletterUrl
                                  })
                                }
                            ]
                        });
                    });
                    results.push({ jid, status: 'success' });
                } else if (type === 'text') {
                    await sendWithRetry(async () => {
                        await sendButtons(global.Gifted, jid, {
                            title: '',            
                            text: message,    
                            footer: `> *${botFooter}*`,            
                            buttons: [ 
                                {
                                  name: 'cta_url',
                                  buttonParamsJson: JSON.stringify({
                                    display_text: 'WaChannel',
                                    url: newsletterUrl
                                  })
                                }
                            ]
                        });
                    });
                    results.push({ jid, status: 'success' });
                } else if (type === 'media') {
                    if (!mediaUrl) {
                        results.push({ jid, status: 'error', error: 'Media URL is Required' });
                        continue;
                    }
                    await sendWithRetry(async () => {
                        await handleMediaMessage({ mediaUrl, mediaType, filename, caption }, jid);
                    });
                    results.push({ jid, status: 'success' });
                } else {
                    results.push({ jid, status: 'error', error: 'Invalid Message Type' });
                }
            } catch (error) {
                console.error(`❌ Error Sending Message to ${jid}:`, error.message);
                results.push({ 
                    jid, 
                    status: 'error', 
                    error: error.message,
                    stack: config.MODE === 'development' ? error.stack : undefined
                });
            }
        }

        const allFailed = results.every(r => r.status === 'error');
        if (allFailed) {
            return res.status(500).json({ 
                status: 500,
                success: 'false',
                creator: 'GiftedTech',
                error: 'All Messages Failed', 
                results
            });
        }

        const anyFailed = results.some(r => r.status === 'error');
        if (anyFailed) {
            return res.status(207).json({
                status: 207, 
                success: 'partial_success',
                creator: 'GiftedTech',
                message: 'Some Messages Failed',
                results
            });
        }

        return res.json({ 
            status: 200, 
            success: 'true',
            creator: 'GiftedTech',
            message: 'Message Sent Successfully',
            results
        });

    } catch (error) {
        console.error('❌ Error Processing Request:', error.message);
        return res.status(500).json({ 
            status: 500,
            success: 'false',
            creator: 'GiftedTech',
            error: error.message,
            stack: config.MODE === 'development' ? error.stack : undefined
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 200,
        success: true,
        service: 'Whatsapp Sender Api',
        connected: isConnectionReady(),
        reconnectAttempts: reconnectAttempts,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 200,
        connected: isConnectionReady(),
        user: global.Gifted?.user?.id || null,
        reconnectAttempts: reconnectAttempts,
        isConnecting: isConnecting,
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
    console.log(`🚀 Gifted Server Live at http://localhost:${PORT}`);
    await startGifted();
});

process.on('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    clearConnectionTimers();
    if (store) {
        store.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    clearConnectionTimers();
    if (store) {
        store.destroy();
    }
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection:', reason);
});
