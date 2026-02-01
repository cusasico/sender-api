const CONNECTION_CONFIG = {
    maxReconnectAttempts: 15,
    initialReconnectInterval: 3000,
    maxReconnectInterval: 60000,
    connectionTimeout: 90000,
    stabilizationDelay: 2000,
    longWaitTime: 300000
};

class ConnectionManager {
    constructor(options = {}) {
        this.config = { ...CONNECTION_CONFIG, ...options };
        this.isConnecting = false;
        this.connectionReady = false;
        this.connectionLock = false;
        this.reconnectAttempts = 0;
        this.connectionMessageSent = false;
        this.connectionTimeout = null;
        this.reconnectTimeout = null;
        this.startCallback = null;
    }

    setStartCallback(callback) {
        this.startCallback = callback;
    }

    clearTimers() {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    getReconnectInterval() {
        const interval = Math.min(
            this.config.initialReconnectInterval * Math.pow(1.5, this.reconnectAttempts),
            this.config.maxReconnectInterval
        );
        return interval + Math.random() * 1000;
    }

    handleReconnection() {
        if (this.connectionLock) {
            console.log('🔒 Connection lock active, skipping reconnection');
            return;
        }
        
        this.isConnecting = false;
        this.connectionReady = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts <= this.config.maxReconnectAttempts) {
            const interval = this.getReconnectInterval();
            console.log(`♻️ Reconnection attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${Math.round(interval/1000)}s`);
            
            this.reconnectTimeout = setTimeout(() => {
                if (this.startCallback) {
                    this.startCallback();
                }
            }, interval);
        } else {
            console.error('❌ Max reconnection attempts reached. Resetting counter and waiting 5 minutes...');
            this.reconnectAttempts = 0;
            
            this.reconnectTimeout = setTimeout(() => {
                if (this.startCallback) {
                    this.startCallback();
                }
            }, this.config.longWaitTime);
        }
    }

    isReady() {
        return this.connectionReady && global.Gifted && global.Gifted.user;
    }

    async waitForConnection(timeout = 30000) {
        const startTime = Date.now();
        while (!this.isReady()) {
            if (Date.now() - startTime > timeout) {
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return true;
    }

    setConnectionTimeout(callback) {
        this.connectionTimeout = setTimeout(() => {
            if (!this.connectionReady) {
                console.log('⌛ Connection timeout. Attempting to reconnect...');
                this.connectionLock = false;
                callback();
            }
        }, this.config.connectionTimeout);
    }

    onQRGenerated() {
        console.log('🔑 QR Code Generated - Scan to Connect');
        clearTimeout(this.connectionTimeout);
        this.connectionMessageSent = false;
        this.connectionReady = false;
    }

    async onConnectionOpen() {
        console.log('✅ Connected to WhatsApp');
        this.clearTimers();
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.connectionLock = false;
        
        await new Promise(resolve => setTimeout(resolve, this.config.stabilizationDelay));
        this.connectionReady = true;
    }

    onConnectionClose(statusCode, shouldReconnect) {
        this.connectionReady = false;
        console.log(`🔌 Connection Closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`);
        this.connectionMessageSent = false;
        this.connectionLock = false;
        
        if (shouldReconnect) {
            this.handleReconnection();
        } else {
            console.log('❌ Logged out. Please update SESSION_ID and restart.');
            this.isConnecting = false;
            this.reconnectAttempts = 0;
        }
    }

    prepareConnection() {
        if (this.isConnecting || this.connectionLock) {
            console.log('⏳ Already connecting or locked, skipping...');
            return false;
        }
        
        this.connectionLock = true;
        this.isConnecting = true;
        this.connectionReady = false;
        this.clearTimers();
        this.connectionMessageSent = false;
        
        return true;
    }

    onConnectionError() {
        this.connectionLock = false;
        this.handleReconnection();
    }

    getStatus() {
        return {
            isConnecting: this.isConnecting,
            connectionReady: this.connectionReady,
            reconnectAttempts: this.reconnectAttempts,
            isLocked: this.connectionLock
        };
    }

    destroy() {
        this.clearTimers();
        this.isConnecting = false;
        this.connectionReady = false;
        this.connectionLock = false;
        this.reconnectAttempts = 0;
    }
}

module.exports = { ConnectionManager, CONNECTION_CONFIG };
