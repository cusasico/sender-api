const {
  default: giftedConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  generateWAMessageFromContent, 
  proto, 
  prepareWAMessageMedia,
  makeCacheableSignalKeyStore
} = require('gifted-baileys');

const express = require('express'),
      fs = require('fs'),
      path = require('path'),
      axios = require('axios'),
      config = require('./config'),
      { THUMBNAIL: thumbnail } = config,
      { loadSession, CustomStore, logger, handleIncomingMessages, saveMessage, handleMediaMessage } = require('./gift');

const app = express();
const PORT = process.env.PORT || 9000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const sessionDir = path.join(__dirname, "gift", "session");

loadSession();

let store;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 60000;

// Track if connection message has been sent
let connectionMessageSent = false;

// Declare Gifted as a global variable
global.Gifted = null;

let connectionTimeout;
let reconnectInterval;

function clearConnectionTimers() {
    if (connectionTimeout) clearTimeout(connectionTimeout);
    if (reconnectInterval) clearInterval(reconnectInterval);
}

function handleReconnection() {
    isConnecting = false;
    reconnectAttempts++;
    
    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        console.log(`♻️ Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        reconnectInterval = setTimeout(() => {
            startGifted();
        }, RECONNECT_INTERVAL);
    } else {
        console.error('❌ Max reconnection attempts reached. Please check your connection.');
        isConnecting = false;
    }
}

async function startGifted() {
    if (isConnecting) return;
    isConnecting = true;
    clearConnectionTimers();
    connectionMessageSent = false; // Reset connection message flag on new connection attempt

    try {
        console.log('⏱️ Connecting Gifted MD...');
        const { version, isLatest } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        if (store) {
            store.destroy();
        }
        store = new CustomStore();

        const giftedSock = {
            version,
            logger: logger,
            browser: ['GIFTED', "safari", "1.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Error occurred' };
            },
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false,
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

        global.connectionTimeout = setTimeout(() => {
            if (!global.Gifted?.user) {
                console.log('⌛ Connection timeout. Attempting to reconnect...');
                handleReconnection();
            }
        }, CONNECTION_TIMEOUT);

        global.Gifted = giftedConnect(giftedSock);
        store.bind(global.Gifted.ev);

        global.Gifted.ev.on('creds.update', saveCreds);

        global.Gifted.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('🔑 QR Code Generated - Scan to Connect');
                clearTimeout(connectionTimeout);
                connectionMessageSent = false; // Reset when new QR is generated
            }

            if (connection === 'close') {
                const shouldReconnect =
                    (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                console.log('🔌 Connection Closed. Reconnecting...', shouldReconnect);
                connectionMessageSent = false; // Reset on connection close
                
                if (shouldReconnect) {
                    handleReconnection();
                } else {
                    console.log('❌ Logged out. Please scan QR code again.');
                    isConnecting = false;
                }
            } else if (connection === 'open') {
                console.log('✅ Connected to WhatsApp');
                clearConnectionTimers();
                reconnectAttempts = 0;
                
                // Only send connection message if it hasn't been sent yet
                if (!connectionMessageSent) {
                    sendConnectionMessage();
                    connectionMessageSent = true;
                }
            }
        });

        global.Gifted.ev.on('messages.upsert', handleIncomingMessages);
        global.Gifted.ev.on('error', (error) => {
            console.error('⚠️ WhatsApp Connection Error:', error);
        });

    } catch (error) {
        console.error('❌ Initial Connection Error:', error);
        handleReconnection();
    }
}

async function sendConnectionMessage() {
    const startMess = {
        image: { url: thumbnail },
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
                newsletterJid: '120363408839929349@newsletter',
                newsletterName: "GIFTED-TECH",
                serverMessageId: 143
            }
        }
    };
    
    try {
        await global.Gifted.sendMessage(global.Gifted.user.id, startMess);
    } catch (error) {
        console.error('Error sending connection message:', error);
    }
}

app.post('/api/sendMessage.php', async (req, res) => {
    if (!global.Gifted || !global.Gifted.user) {
        return res.status(503).json({ 
            status: 503,
            success: 'false',
            creator: 'GiftedTech',
            error: 'WhatsApp Instance is Not Ready Yet or Disconnected' 
        });
    }

    const { number, message, username, code, type, mediaUrl, mediaType, filename, caption } = req.body;
    
    if (!number || !message) {
        return res.status(400).json({ 
            status: 400,
            success: 'false',
            creator: 'GiftedTech',
            error: 'Number and message are required fields' 
        });
    }

    try {
        const numbers = number.split(',').map(num => num.trim());
        const results = [];
        
        for (const num of numbers) {
            const jid = num.includes('@s.whatsapp.net') ? num : num + '@s.whatsapp.net';
            
            try {
                if (type === 'sendSignupCode') {
                    const msg = generateWAMessageFromContent(jid, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.create({
                                    body: proto.Message.InteractiveMessage.Body.create({
                                        text: `Hello ${username},\nThank you for signing up. To complete your registration, please copy your verification code\n`
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({
                                        text: `> Powered By Gifted Tech`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.create({
                                        ...(await prepareWAMessageMedia({
                                            image: {
                                                url: "https://files.giftedtech.web.id/image/hwOverif-code.jpg"
                                            }
                                        }, {
                                            upload: Gifted.waUploadToServer
                                        })),
                                        title: '',
                                        subtitle: '',
                                        hasMediaAttachment: true 
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                        buttons: [
                                            {
                                                name: "cta_copy",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "Copy Code",
                                                    id: "copy_code",
                                                    copy_code: code
                                                })
                                            },
                                            {
                                                name: "cta_url",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "Follow Channel",
                                                    url: "https://whatsapp.com/channel/0029Vb3hlgX5kg7G0nFggl0Y"
                                                })
                                            }
                                        ]
                                    })
                                })
                            }
                        }
                    }, {});

                    await global.Gifted.relayMessage(msg.key.remoteJid, msg.message, {
                        messageId: msg.key.id
                    });
                    results.push({ jid, status: 'success' });
                } else if (type === 'sendResetCode') {
                    const msg = generateWAMessageFromContent(jid, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.create({
                                    body: proto.Message.InteractiveMessage.Body.create({
                                        text: message
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({
                                        text: `> Powered By Gifted Tech`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.create({
                                        ...(await prepareWAMessageMedia({
                                            image: {
                                                url: "https://files.giftedtech.web.id/image/hwOverif-code.jpg"
                                            }
                                        }, {
                                            upload: Gifted.waUploadToServer
                                        })),
                                        title: '',
                                        subtitle: '',
                                        hasMediaAttachment: true 
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                        buttons: [
                                            {
                                                name: "cta_copy",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "Copy Code",
                                                    id: "copy_code",
                                                    copy_code: code
                                                })
                                            },
                                            {
                                                name: "cta_url",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "Follow Channel",
                                                    url: "https://whatsapp.com/channel/0029Vb3hlgX5kg7G0nFggl0Y"
                                                })
                                            }
                                        ]
                                    })
                                })
                            }
                        }
                    }, {});

                    await global.Gifted.relayMessage(msg.key.remoteJid, msg.message, {
                        messageId: msg.key.id
                    });
                    results.push({ jid, status: 'success' });
                  } else if (type === 'sendResendCode') {
                    const msg = generateWAMessageFromContent(jid, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.create({
                                    body: proto.Message.InteractiveMessage.Body.create({
                                        text: message
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({
                                        text: `> Powered By Gifted Tech`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.create({
                                        ...(await prepareWAMessageMedia({
                                            image: {
                                                url: "https://files.giftedtech.web.id/image/hwOverif-code.jpg"
                                            }
                                        }, {
                                            upload: Gifted.waUploadToServer
                                        })),
                                        title: '',
                                        subtitle: '',
                                        hasMediaAttachment: true 
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                        buttons: [
                                            {
                                                name: "cta_copy",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "Copy Code",
                                                    id: "copy_code",
                                                    copy_code: code
                                                })
                                            },
                                            {
                                                name: "cta_url",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "Follow Channel",
                                                    url: "https://whatsapp.com/channel/0029Vb3hlgX5kg7G0nFggl0Y"
                                                })
                                            }
                                        ]
                                    })
                                })
                            }
                        }
                    }, {});

                    await global.Gifted.relayMessage(msg.key.remoteJid, msg.message, {
                        messageId: msg.key.id
                    });
                    results.push({ jid, status: 'success' });
                } else if (type === 'sendDeleteCode') {
                    const msg = generateWAMessageFromContent(jid, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.create({
                                    body: proto.Message.InteractiveMessage.Body.create({
                                        text: message
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({
                                        text: `> Powered By Gifted Tech`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.create({
                                        ...(await prepareWAMessageMedia({
                                            image: {
                                                url: "https://files.giftedtech.web.id/image/hwOverif-code.jpg"
                                            }
                                        }, {
                                            upload: Gifted.waUploadToServer
                                        })),
                                        title: '',
                                        subtitle: '',
                                        hasMediaAttachment: true 
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                        buttons: [
                                            {
                                                name: "cta_copy",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "Copy Code",
                                                    id: "copy_code",
                                                    copy_code: code
                                                })
                                            },
                                            {
                                                name: "cta_url",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "Follow Channel",
                                                    url: "https://whatsapp.com/channel/0029Vb3hlgX5kg7G0nFggl0Y"
                                                })
                                            }
                                        ]
                                    })
                                })
                            }
                        }
                    }, {});

                    await global.Gifted.relayMessage(msg.key.remoteJid, msg.message, {
                        messageId: msg.key.id
                    });
                    results.push({ jid, status: 'success' });
                } else if (type === 'text') {
                    const msg = generateWAMessageFromContent(jid, {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadata: {},
                                    deviceListMetadataVersion: 2
                                },
                                interactiveMessage: proto.Message.InteractiveMessage.create({
                                    body: proto.Message.InteractiveMessage.Body.create({
                                        text: message
                                    }),
                                    footer: proto.Message.InteractiveMessage.Footer.create({
                                        text: `> Powered By Gifted Tech`
                                    }),
                                    header: proto.Message.InteractiveMessage.Header.create({
                                        ...(await prepareWAMessageMedia({
                                            image: {
                                                url: "https://files.giftedtech.web.id/file/gifted-md.jpg"
                                            }
                                        }, {
                                            upload: Gifted.waUploadToServer
                                        })),
                                        title: '',
                                        subtitle: '',
                                        hasMediaAttachment: true 
                                    }),
                                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                        buttons: [
                                            {
                                                name: "cta_url",
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: "Follow Channel",
                                                    url: "https://whatsapp.com/channel/0029Vb3hlgX5kg7G0nFggl0Y"
                                                })
                                            }
                                        ]
                                    })
                                })
                            }
                        }
                    }, {});

                    await global.Gifted.relayMessage(msg.key.remoteJid, msg.message, {
                        messageId: msg.key.id
                    });
                    results.push({ jid, status: 'success' });
                } else if (type === 'media') {
                    if (!mediaUrl) {
                        results.push({ jid, status: 'error', error: 'Media URL is Required' });
                        continue;
                    }
                    await handleMediaMessage({ mediaUrl, mediaType, filename, caption }, jid);
                    results.push({ jid, status: 'success' });
                } else {
                    results.push({ jid, status: 'error', error: 'Invalid Message Type' });
                }
            } catch (error) {
                console.error(`❌ Error Sending Message to ${jid}:`, error);
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
        console.error('❌ Error Processing Request:', error);
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

process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error);
    if (!isConnecting) {
        startGifted();
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});
