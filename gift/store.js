class CustomStore {
    constructor(options = {}) {
        this.messages = new Map();
        this.contacts = new Map();
        this.chats = new Map();
        this.maxMessages = options.maxMessages || 10000;
        this.maxChats = options.maxChats || 5000;
        this.cleanupIntervalMs = options.cleanupIntervalMs || 300000;
        this.cleanupInterval = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
    }

    loadMessage(jid, id) {
        const chatMessages = this.messages.get(jid);
        return chatMessages?.get(id) || null;
    }

    saveMessage(jid, message) {
        if (!this.messages.has(jid)) {
            this.messages.set(jid, new Map());
        }
        
        const chatMessages = this.messages.get(jid);
        chatMessages.set(message.key.id, message);
        
        if (chatMessages.size > this.maxMessages) {
            const firstKey = chatMessages.keys().next().value;
            chatMessages.delete(firstKey);
        }
    }

    cleanup() {
        try {
            if (this.messages.size > this.maxChats) {
                const chatsToDelete = this.messages.size - this.maxChats;
                const oldestChats = Array.from(this.messages.keys()).slice(0, chatsToDelete);
                oldestChats.forEach(jid => this.messages.delete(jid));
            }
            
            console.log(`🧹 Store cleanup: ${this.messages.size} chats in memory`);
        } catch (error) {
            console.error('Store cleanup error:', error);
        }
    }

    getStats() {
        return {
            totalChats: this.messages.size,
            totalContacts: this.contacts.size,
            totalChatRecords: this.chats.size
        };
    }

    bind(ev) {
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key?.remoteJid && msg.key?.id) {
                    this.saveMessage(msg.key.remoteJid, msg);
                }
            });
        });

        ev.on('chats.set', ({ chats }) => {
            chats.forEach(chat => {
                this.chats.set(chat.id, chat);
            });
        });

        ev.on('contacts.set', ({ contacts }) => {
            contacts.forEach(contact => {
                this.contacts.set(contact.id, contact);
            });
        });
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.messages.clear();
        this.contacts.clear();
        this.chats.clear();
    }
}

module.exports = { CustomStore };
