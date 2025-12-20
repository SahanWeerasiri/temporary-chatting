const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const chatRoutes = require('./src/routes/chats');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);

// Create necessary directories
const fs = require('fs');
const dataDir = path.join(__dirname, 'src/data');
const chatsDir = path.join(dataDir, 'chats');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir, { recursive: true });

// Initialize users.json if not exists
const usersFile = path.join(dataDir, 'users.json');
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});