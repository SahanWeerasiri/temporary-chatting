const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if username already exists
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create new user
        const user = new User(username, password);
        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                authToken: user.authToken,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Validate password
        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate new token
        user.authToken = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'temporary-chat-secret',
            { expiresIn: '24h' }
        );

        await user.save();

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                authToken: user.authToken,
                pendingInvites: user.pendingInvites || [],
                activeChats: user.activeChats || []
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Validate token
router.post('/validate', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const user = await User.findByToken(token);

        if (!user) {
            return res.status(401).json({
                valid: false,
                error: 'Invalid or expired token'
            });
        }

        res.json({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                pendingInvites: user.pendingInvites || [],
                activeChats: user.activeChats || []
            }
        });
    } catch (error) {
        res.status(401).json({
            valid: false,
            error: error.message
        });
    }
});

// Get user profile (protected route)
router.get('/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await User.findByToken(token);

        if (!user) {
            return res.status(401).json({ error: 'Invalid authentication token' });
        }

        res.json({
            user: {
                id: user.id,
                username: user.username,
                pendingInvites: user.pendingInvites || [],
                activeChats: user.activeChats || [],
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logout (optional - client-side token removal)
router.post('/logout', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        // In a stateless JWT system, logout is handled client-side
        // We could implement token blacklisting here if needed
        res.json({
            message: 'Logout successful',
            note: 'Please remove the token from client-side storage'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;