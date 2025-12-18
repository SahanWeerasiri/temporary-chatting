const FileStorage = require('../utils/fileStorage');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const usersFile = path.join(__dirname, '../data/users.json');
const userStorage = new FileStorage(usersFile);

class User {
    constructor(username, password) {
        this.id = uuidv4();
        this.username = username;
        this.password = this.hashPassword(password);
        this.authToken = this.generateToken();
        this.createdAt = new Date().toISOString();
        this.pendingInvites = [];
        this.activeChats = [];
    }

    // Hydrate a plain object to a User instance
    static fromObject(obj) {
        const user = Object.create(User.prototype);
        return Object.assign(user, obj);
    }

    hashPassword(password) {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }

    generateToken() {
        return jwt.sign(
            { userId: this.id, username: this.username },
            process.env.JWT_SECRET || 'temporary-chat-secret',
            { expiresIn: '24h' }
        );
    }

    validatePassword(password) {
        return bcrypt.compareSync(password, this.password);
    }

    static async create(username, password) {
        const existingUser = await userStorage.findOne({ username });
        if (existingUser) {
            throw new Error('Username already exists');
        }

        const user = new User(username, password);
        await userStorage.insert(user);
        return user;
    }

    static async findByUsername(username) {
        const obj = await userStorage.findOne({ username });
        return obj ? User.fromObject(obj) : null;
    }

    static async findById(id) {
        const obj = await userStorage.findOne({ id });
        return obj ? User.fromObject(obj) : null;
    }

    static async findByToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'temporary-chat-secret');
            return await this.findById(decoded.userId);
        } catch (error) {
            return null;
        }
    }

    // ADD THIS SAVE METHOD
    async save() {
        const existingUser = await userStorage.findOne({ id: this.id });
        if (existingUser) {
            return await userStorage.update({ id: this.id }, this);
        } else {
            return await userStorage.insert(this);
        }
    }

    async addPendingInvite(fromUserId, fromUsername) {
        this.pendingInvites.push({
            fromUserId,
            fromUsername,
            timestamp: new Date().toISOString()
        });
        return await this.save();
    }

    async removePendingInvite(fromUserId) {
        this.pendingInvites = this.pendingInvites.filter(invite => invite.fromUserId !== fromUserId);
        return await this.save();
    }

    async addActiveChat(chatId) {
        if (!this.activeChats.includes(chatId)) {
            this.activeChats.push(chatId);
            await this.save();
        }
    }

    async removeActiveChat(chatId) {
        this.activeChats = this.activeChats.filter(id => id !== chatId);
        await this.save();
    }
}

module.exports = User;