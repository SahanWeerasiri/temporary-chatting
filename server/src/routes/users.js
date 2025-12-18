
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// Search users by username
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const allUsers = await new (require('../utils/fileStorage'))(
            require('path').join(__dirname, '../data/users.json')
        ).read();

        const filteredUsers = allUsers
            .filter(user =>
                user.username.toLowerCase().includes(query.toLowerCase()) &&
                user.id !== req.user.id
            )
            .map(user => ({
                id: user.id,
                username: user.username
            }));

        res.json({ users: filteredUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user.id,
                username: req.user.username,
                pendingInvites: req.user.pendingInvites,
                activeChats: req.user.activeChats
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;