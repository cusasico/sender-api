const {
    default: giftedConnect,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestWaWebVersion,
    makeCacheableSignalKeyStore
} = require('gifted-baileys');

const express = require('express');
const path = require('path');
const config = require('./config');

const {
    loadSession,
    getSessionDir,
    CustomStore,
    logger,
    handleIncomingMessages,
    ConnectionManager,
    validateRequest,
    processNumbers,
    analyzeResults,
    createErrorResponse
} = require('./gift');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

loadSession();

let store = null;
const connectionManager = new ConnectionManager();

global.Gifted = null;

function getSocketConfig(state) {
    return {
        version: null,
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
        patchMessageBeforeSending: patchMessage
    };
}

function patchMessage(message) {
    const requiresPatch = !!(
        message.buttonsMessage ||
        message.templateMessage ||
        message.listMessage
    );
    
    if (requiresPatch) {
        return {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadataVersion: 2,
                        deviceListMetadata: {}
                    },
                    ...message
                }
            }
        };
    }
    return message;
}

async function sendConnectionMessage() {
    if (!connectionManager.isReady()) {
        console.log('⚠️ Connection not ready for sending message');
        return;
    }
    
    const startMessage = {
        image: { url: config.THUMBNAIL },
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
                newsletterJid: config.NEWSLETTER_JID,
                newsletterName: 'GIFTED-TECH',
                serverMessageId: 143
            }
        }
    };
    
    try {
        await global.Gifted.sendMessage(global.Gifted.user.id, startMessage);
    } catch (error) {
        console.error('Error sending connection message:', error.message);
    }
}

function setupEventHandlers(saveCreds) {
    global.Gifted.ev.on('creds.update', saveCreds);

    global.Gifted.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            connectionManager.onQRGenerated();
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            connectionManager.onConnectionClose(statusCode, shouldReconnect);
        } else if (connection === 'connecting') {
            console.log('🔄 Connecting...');
        } else if (connection === 'open') {
            await connectionManager.onConnectionOpen();
            
            if (!connectionManager.connectionMessageSent) {
                try {
                    await sendConnectionMessage();
                    connectionManager.connectionMessageSent = true;
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
}

async function startGifted() {
    if (!connectionManager.prepareConnection()) {
        return;
    }

    try {
        console.log('⏱️ Connecting Gifted MD...');
        
        const { version } = await fetchLatestWaWebVersion();
        const sessionDir = getSessionDir();
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        if (store) {
            store.destroy();
        }
        store = new CustomStore();

        const socketConfig = getSocketConfig(state);
        socketConfig.version = version;

        connectionManager.setConnectionTimeout(() => connectionManager.handleReconnection());
        connectionManager.setStartCallback(startGifted);

        global.Gifted = giftedConnect(socketConfig);
        store.bind(global.Gifted.ev);

        setupEventHandlers(saveCreds);

    } catch (error) {
        console.error('❌ Initial Connection Error:', error.message);
        connectionManager.onConnectionError();
    }
}

app.post('/api/sendMessage.php', async (req, res) => {
    if (!connectionManager.isReady()) {
        const ready = await connectionManager.waitForConnection(10000);
        if (!ready) {
            return res.status(503).json(
                createErrorResponse(503, 'WhatsApp Instance is Not Ready Yet or Disconnected')
            );
        }
    }

    const validation = validateRequest(req.body);
    if (!validation.valid) {
        return res.status(validation.status).json(
            createErrorResponse(validation.status, validation.error)
        );
    }

    try {
        const numbers = req.body.number.split(',');
        const results = await processNumbers(numbers, req.body, connectionManager);
        const { status, response } = analyzeResults(results);
        
        return res.status(status).json(response);
    } catch (error) {
        console.error('❌ Error Processing Request:', error.message);
        return res.status(500).json(
            createErrorResponse(500, error.message, {
                stack: config.MODE === 'development' ? error.stack : undefined
            })
        );
    }
});

app.get('/health', (req, res) => {
    const status = connectionManager.getStatus();
    res.json({
        status: 200,
        success: true,
        service: 'Whatsapp Sender Api',
        connected: connectionManager.isReady(),
        reconnectAttempts: status.reconnectAttempts,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    const status = connectionManager.getStatus();
    res.json({
        status: 200,
        connected: connectionManager.isReady(),
        user: global.Gifted?.user?.id || null,
        reconnectAttempts: status.reconnectAttempts,
        isConnecting: status.isConnecting,
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
    connectionManager.destroy();
    if (store) {
        store.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    connectionManager.destroy();
    if (store) {
        store.destroy();
    }
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Unhandled Rejection:', reason);
});
