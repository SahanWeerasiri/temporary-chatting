const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Chat = require('../models/Chat');

// Send chat invitation
router.post('/invite', authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        if (username === req.user.username) {
            return res.status(400).json({ error: 'Cannot invite yourself' });
        }

        const invitedUser = await User.findByUsername(username);

        if (!invitedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if chat already exists
        const existingChat = req.user.activeChats.find(chatId => {
            const chat = Chat.findById(chatId);
            return chat &&
                ((chat.user1Id === req.user.id && chat.user2Id === invitedUser.id) ||
                    (chat.user2Id === req.user.id && chat.user1Id === invitedUser.id));
        });

        if (existingChat) {
            return res.status(400).json({ error: 'Chat already exists with this user' });
        }

        // Add pending invite
        await invitedUser.addPendingInvite(req.user.id, req.user.username);

        res.json({
            message: 'Invitation sent successfully',
            invitedUser: {
                id: invitedUser.id,
                username: invitedUser.username
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept chat invitation
router.post('/accept', authMiddleware, async (req, res) => {
    try {
        const { fromUserId } = req.body;

        if (!fromUserId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Find and remove pending invite
        const pendingInvite = req.user.pendingInvites.find(invite => invite.fromUserId === fromUserId);

        if (!pendingInvite) {
            return res.status(404).json({ error: 'Invitation not found or already accepted' });
        }

        const invitingUser = await User.findById(fromUserId);

        if (!invitingUser) {
            return res.status(404).json({ error: 'Inviting user not found' });
        }

        // Create new chat
        const chat = await Chat.create(
            req.user.id,
            invitingUser.id,
            req.user.username,
            invitingUser.username
        );

        // Add chat to both users' active chats
        await req.user.addActiveChat(chat.id);
        await invitingUser.addActiveChat(chat.id);

        // Remove pending invite
        await req.user.removePendingInvite(fromUserId);

        res.json({
            message: 'Chat invitation accepted',
            chat: {
                id: chat.id,
                user1Id: chat.user1Id,
                user2Id: chat.user2Id,
                user1Username: chat.user1Username,
                user2Username: chat.user2Username,
                createdAt: chat.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reject chat invitation
router.post('/reject', authMiddleware, async (req, res) => {
    try {
        const { fromUserId } = req.body;

        if (!fromUserId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        await req.user.removePendingInvite(fromUserId);

        res.json({ message: 'Chat invitation rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's active chats
router.get('/active', authMiddleware, async (req, res) => {
    try {
        const chats = [];

        for (const chatId of req.user.activeChats) {
            const chat = await Chat.findById(chatId);
            if (chat && chat.isActive) {
                chats.push({
                    id: chat.id,
                    otherUser: chat.user1Id === req.user.id ? chat.user2Username : chat.user1Username,
                    otherUserId: chat.user1Id === req.user.id ? chat.user2Id : chat.user1Id,
                    createdAt: chat.createdAt,
                    lastMessage: chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null
                });
            }
        }

        res.json({ chats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific chat messages
router.get('/:chatId/messages', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;

        if (!req.user.activeChats.includes(chatId)) {
            return res.status(403).json({ error: 'Access denied to this chat' });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.json({
            chat: {
                id: chat.id,
                user1Id: chat.user1Id,
                user2Id: chat.user2Id,
                user1Username: chat.user1Username,
                user2Username: chat.user2Username,
                isActive: chat.isActive
            },
            messages: await chat.getMessages()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send message in chat
router.post('/:chatId/messages', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({ error: 'Message content is required' });
        }

        if (!req.user.activeChats.includes(chatId)) {
            return res.status(403).json({ error: 'Access denied to this chat' });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (!chat.isActive) {
            return res.status(400).json({ error: 'Chat is closed' });
        }

        const message = await chat.addMessage(req.user.id, content.trim());

        res.json({
            message: 'Message sent successfully',
            message: message
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Close chat session
router.post('/:chatId/close', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.params;

        if (!req.user.activeChats.includes(chatId)) {
            return res.status(403).json({ error: 'Access denied to this chat' });
        }

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        if (!chat.isActive) {
            return res.status(400).json({ error: 'Chat is already closed' });
        }

        // Remove chat from both users' active chats
        const user1 = await User.findById(chat.user1Id);
        const user2 = await User.findById(chat.user2Id);

        if (user1) await user1.removeActiveChat(chatId);
        if (user2) await user2.removeActiveChat(chatId);

        // Close the chat
        await chat.close(req.user.id);

        res.json({ message: 'Chat closed successfully. Chat data will be deleted in 1 minute.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
