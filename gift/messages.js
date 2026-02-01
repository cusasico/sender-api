const config = require('../config');
const { getContentType, isJidBroadcast, jidNormalizedUser } = require('gifted-baileys');
const { saveMessage } = require('./logger');

const { 
    NEWSLETTER_URL: newsletterUrl,
    FOOTER: botFooter 
} = config;

const MESSAGE_TEMPLATES = {
    signup: (username, code) => ({
        title: '',
        text: `Hello *${username},*\nThank you for signing up. To complete your registration, please copy your verification code.\nThe code will expire in *10 minutes.*\nIf you didn't request this signup, please ignore this message or contact our support team.\n`,
        footer: `> *${botFooter}*`,
        buttons: [
            { 
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({ 
                    display_text: 'Copy', 
                    copy_code: code 
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: 'WaChannel',
                    url: newsletterUrl
                })
            }
        ]
    }),

    reset: (username, code) => ({
        title: '',
        text: `Hello *${username},*\nWe have received a request to reset your account password, please copy your verification code.\n⚠️ If you didn't request this password reset, please secure your account immediately as someone else may be trying to access it.\nThe code will expire in *10 minutes.*\n> *Security Tip:* Never share your verification code with anyone\n`,
        footer: `> *${botFooter}*`,
        buttons: [
            { 
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({ 
                    display_text: 'Copy', 
                    copy_code: code 
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: 'WaChannel',
                    url: newsletterUrl
                })
            }
        ]
    }),

    resend: (username, code) => ({
        title: '',
        text: `Hello *${username},*\nWe've received a request to resend a new verification code, please copy your verification code.\nThe code will expire in *10 minutes.*\n> *Security Tip:* Never share your verification code with anyone\n`,
        footer: `> *${botFooter}*`,
        buttons: [
            { 
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({ 
                    display_text: 'Copy', 
                    copy_code: code 
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: 'WaChannel',
                    url: newsletterUrl
                })
            }
        ]
    }),

    delete: (username, code) => ({
        title: '',
        text: `Hello *${username},*\nWe received a request to permanently delete your account.\nPlease review the following information carefully:\n> *⚠️ Important:*\nThis action will immediately and permanently:\n- Delete all your account data\n- Remove your access to all services\n- Cancel any active subscriptions\n\nThis action cannot be undone\n\nTo confirm this deletion, please copy your verification code.\nThe code will expire in *10 minutes.*\n> *Security Tip:* Never share your verification code with anyone\n`,
        footer: `> *${botFooter}*`,
        buttons: [
            { 
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({ 
                    display_text: 'Copy', 
                    copy_code: code 
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: 'WaChannel',
                    url: newsletterUrl
                })
            }
        ]
    }),

    text: (message) => ({
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
    })
};

function getMessageTemplate(type, username, code, message) {
    switch (type) {
        case 'sendSignupCode':
            return MESSAGE_TEMPLATES.signup(username, code);
        case 'sendResetCode':
            return MESSAGE_TEMPLATES.reset(username, code);
        case 'sendResendCode':
            return MESSAGE_TEMPLATES.resend(username, code);
        case 'sendDeleteCode':
            return MESSAGE_TEMPLATES.delete(username, code);
        case 'text':
            return MESSAGE_TEMPLATES.text(message);
        default:
            return null;
    }
}

async function handlePresenceUpdate(client, jid) {
    try {
        switch (config.PRESENCE) {
            case 'typing':
                await client.sendPresenceUpdate('composing', jid);
                break;
            case 'recording':
                await client.sendPresenceUpdate('recording', jid);
                break;
            case 'online':
                await client.sendPresenceUpdate('available', jid);
                break;
            default:
                await client.sendPresenceUpdate('unavailable', jid);
        }
    } catch (error) {
        console.error('Error updating presence:', error.message);
    }
}

async function handleAutoReadMessages(client, messageKey) {
    if (config.AUTO_READ_MESSAGES === 'true') {
        try {
            await client.readMessages([messageKey]);
        } catch (error) {
            console.error('Error reading message:', error.message);
        }
    }
}

async function handleStatusInteraction(client, mek) {
    if (!isJidBroadcast(mek.key.remoteJid)) return;

    if (config.AUTO_READ_STATUS === 'true' && mek.key) {
        try {
            await client.readMessages([mek.key]);
        } catch (error) {
            console.error('Error reading status:', error.message);
        }
    }

    if (config.AUTO_LIKE_STATUS === 'true') {
        try {
            const emojis = config.AUTO_LIKE_EMOJIS.split(',');
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            
            if (mek.key.remoteJid && mek.key.participant) {
                await client.sendMessage(mek.key.remoteJid, { 
                    react: { text: randomEmoji, key: mek.key } 
                });
            }
        } catch (error) {
            console.error('Error liking status:', error.message);
        }
    }
}

async function handleIncomingMessages(mek) {
    const client = global.Gifted;
    if (!client) return;

    try {
        mek = mek.messages[0];
        saveMessage(JSON.parse(JSON.stringify(mek, null, 2)));
        
        const fromJid = mek.key.participant || mek.key.remoteJid;
        if (!mek || !mek.message) return;

        mek.message = getContentType(mek.message) === 'ephemeralMessage' 
            ? mek.message.ephemeralMessage.message 
            : mek.message;

        if (fromJid) {
            await handlePresenceUpdate(client, fromJid);
            await handleAutoReadMessages(client, mek.key);
        }

        await handleStatusInteraction(client, mek);
    } catch (error) {
        console.error('Error Processing Message:', error.message);
    }
}

function formatJid(number) {
    return number.includes('@s.whatsapp.net') 
        ? number 
        : `${number}@s.whatsapp.net`;
}

module.exports = {
    handleIncomingMessages,
    getMessageTemplate,
    MESSAGE_TEMPLATES,
    formatJid
};
