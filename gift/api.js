const { sendButtons } = require('gifted-btns');
const { getMessageTemplate, formatJid } = require('./messages');
const { handleMediaMessage } = require('./media');
const config = require('../config');

const CODE_TYPES = ['sendSignupCode', 'sendResetCode', 'sendResendCode', 'sendDeleteCode'];

function createResponse(status, success, message, extra = {}) {
    return {
        status,
        success: String(success),
        creator: 'GiftedTech',
        ...(message && { message }),
        ...extra
    };
}

function createErrorResponse(status, error, extra = {}) {
    return createResponse(status, false, undefined, { error, ...extra });
}

function validateRequest(body) {
    const { number, message, username, code, type } = body;
    const isCodeType = CODE_TYPES.includes(type);
    
    if (!number) {
        return { valid: false, error: 'Number is a required field', status: 400 };
    }
    
    if (isCodeType && (!username || !code)) {
        return { valid: false, error: 'Username and code are required for verification code messages', status: 400 };
    }
    
    if (!isCodeType && type !== 'media' && !message) {
        return { valid: false, error: 'Message is required for text messages', status: 400 };
    }
    
    return { valid: true };
}

async function sendWithRetry(sendFn, connectionManager, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (!connectionManager.isReady()) {
            console.log(`⏳ Waiting for connection (attempt ${attempt})...`);
            const ready = await connectionManager.waitForConnection(15000);
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

async function processMessage(params, jid, connectionManager) {
    const { type, message, username, code, mediaUrl, name, caption } = params;
    const client = global.Gifted;

    if (type === 'media') {
        if (!mediaUrl) {
            throw new Error('Media URL is Required');
        }
        return await sendWithRetry(async () => {
            return await handleMediaMessage({ mediaUrl, name, caption }, jid, client);
        }, connectionManager);
    }

    const template = getMessageTemplate(type, username, code, message);
    if (!template) {
        throw new Error('Invalid Message Type');
    }

    return await sendWithRetry(async () => {
        return await sendButtons(client, jid, template);
    }, connectionManager);
}

async function processNumbers(numbers, params, connectionManager) {
    const results = [];
    
    for (const num of numbers) {
        const jid = formatJid(num.trim());
        
        try {
            await processMessage(params, jid, connectionManager);
            results.push({ jid, status: 'success' });
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
    
    return results;
}

function analyzeResults(results) {
    const allFailed = results.every(r => r.status === 'error');
    const anyFailed = results.some(r => r.status === 'error');
    
    if (allFailed) {
        return {
            status: 500,
            response: createErrorResponse(500, 'All Messages Failed', { results })
        };
    }
    
    if (anyFailed) {
        return {
            status: 207,
            response: createResponse(207, 'partial_success', 'Some Messages Failed', { results })
        };
    }
    
    return {
        status: 200,
        response: createResponse(200, true, 'Message Sent Successfully', { results })
    };
}

module.exports = {
    validateRequest,
    sendWithRetry,
    processMessage,
    processNumbers,
    analyzeResults,
    createResponse,
    createErrorResponse,
    CODE_TYPES
};
