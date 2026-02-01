const pino = require('pino');
const fs = require('fs');
const path = require('path');

const logger = pino({ 
    level: process.env.LOG_LEVEL || 'silent',
    transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: { colorize: true }
    } : undefined
});

const MESSAGE_LOG_PATH = path.join(__dirname, 'message_log.json');
const MAX_LOG_ENTRIES = 1000;

function saveMessage(message) {
    try {
        let logData = [];
        
        if (fs.existsSync(MESSAGE_LOG_PATH)) {
            try {
                logData = JSON.parse(fs.readFileSync(MESSAGE_LOG_PATH, 'utf8'));
            } catch {
                logData = [];
            }
        }
        
        logData.push({ 
            timestamp: new Date().toISOString(), 
            message 
        });
        
        if (logData.length > MAX_LOG_ENTRIES) {
            logData = logData.slice(-MAX_LOG_ENTRIES);
        }
        
        fs.writeFileSync(MESSAGE_LOG_PATH, JSON.stringify(logData, null, 2));
    } catch (error) {
        console.error('Error saving message:', error.message);
    }
}

function clearMessageLog() {
    try {
        if (fs.existsSync(MESSAGE_LOG_PATH)) {
            fs.unlinkSync(MESSAGE_LOG_PATH);
        }
    } catch (error) {
        console.error('Error clearing message log:', error.message);
    }
}

module.exports = { 
    logger, 
    saveMessage, 
    clearMessageLog,
    MESSAGE_LOG_PATH 
};
