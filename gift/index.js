const { loadSession, getSessionDir, SESSION_DIR } = require('./session');
const { CustomStore } = require('./store');
const { logger, saveMessage, clearMessageLog } = require('./logger');
const { handleIncomingMessages, getMessageTemplate, formatJid, MESSAGE_TEMPLATES } = require('./messages');
const { handleMediaMessage, detectMimeType, MIME_MAP } = require('./media');
const { ConnectionManager, CONNECTION_CONFIG } = require('./connection');
const { 
    validateRequest, 
    sendWithRetry, 
    processNumbers, 
    analyzeResults,
    createResponse,
    createErrorResponse,
    CODE_TYPES 
} = require('./api');

module.exports = {
    loadSession,
    getSessionDir,
    SESSION_DIR,
    
    CustomStore,
    
    logger,
    saveMessage,
    clearMessageLog,
    
    handleIncomingMessages,
    getMessageTemplate,
    formatJid,
    MESSAGE_TEMPLATES,
    
    handleMediaMessage,
    detectMimeType,
    MIME_MAP,
    
    ConnectionManager,
    CONNECTION_CONFIG,
    
    validateRequest,
    sendWithRetry,
    processNumbers,
    analyzeResults,
    createResponse,
    createErrorResponse,
    CODE_TYPES
};
