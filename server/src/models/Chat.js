
const FileStorage = require('../utils/fileStorage');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

class Chat {
    // Hydrate a plain object to a Chat instance
    static fromObject(obj) {
        const chat = Object.create(Chat.prototype);
        return Object.assign(chat, obj);
    }
    constructor(user1Id, user2Id, user1Username, user2Username) {
        this.id = uuidv4();
        this.user1Id = user1Id;
        this.user2Id = user2Id;
        this.user1Username = user1Username;
        this.user2Username = user2Username;
        this.createdAt = new Date().toISOString();
        this.isActive = true;
        this.messages = [];
        this.closedBy = null;
        this.closedAt = null;
    }

    static async create(user1Id, user2Id, user1Username, user2Username) {
        const chat = new Chat(user1Id, user2Id, user1Username, user2Username);
        await chat.save();
        return chat;
    }

    getChatFilePath() {
        return path.join(__dirname, `../data/chats/${this.id}.json`);
    }

    async save() {
        const filePath = this.getChatFilePath();
        const chatStorage = new FileStorage(filePath);
        await chatStorage.write(this);
    }

    static async findById(chatId) {
        const filePath = path.join(__dirname, `../data/chats/${chatId}.json`);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const chatStorage = new FileStorage(filePath);
        const data = await chatStorage.read();
        return data ? Chat.fromObject(data) : null;
    }

    static async delete(chatId) {
        const filePath = path.join(__dirname, `../data/chats/${chatId}.json`);

        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            return true;
        }
        return false;
    }

    async addMessage(senderId, content) {
        const message = {
            id: uuidv4(),
            senderId,
            content,
            timestamp: new Date().toISOString()
        };

        this.messages.push(message);
        await this.save();
        return message;
    }

    async close(userId) {
        this.isActive = false;
        this.closedBy = userId;
        this.closedAt = new Date().toISOString();
        await this.save();

        // Delete chat file after 1 minute of closure
        setTimeout(async () => {
            await Chat.delete(this.id);
        }, 60000);
    }

    async getMessages() {
        return this.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
}

module.exports = Chat;