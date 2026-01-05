
import axios from 'axios';

// Get API URL from Choreo-injected config or fallback to localhost
const getApiUrl = () => {
    if (window.configs?.apiUrl) {
        // Choreo production environment
        return window.configs.apiUrl + '/api';
    }
    // Local development
    return process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
};

const api = axios.create({
    baseURL: getApiUrl(),
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authAPI = {
    register: (username, password) =>
        api.post('/auth/register', { username, password }),

    login: (username, password) =>
        api.post('/auth/login', { username, password }),

    validateToken: (token) =>
        api.post('/auth/validate', { token })
};

export const usersAPI = {
    search: (query) =>
        api.get(`/users/search?query=${query}`),

    getProfile: () =>
        api.get('/users/profile')
};

export const chatsAPI = {
    sendInvite: (username) =>
        api.post('/chats/invite', { username }),

    acceptInvite: (fromUserId) =>
        api.post('/chats/accept', { fromUserId }),

    rejectInvite: (fromUserId) =>
        api.post('/chats/reject', { fromUserId }),

    getActiveChats: () =>
        api.get('/chats/active'),

    getChatMessages: (chatId) =>
        api.get(`/chats/${chatId}/messages`),

    sendMessage: (chatId, content) =>
        api.post(`/chats/${chatId}/messages`, { content }),

    closeChat: (chatId) =>
        api.post(`/chats/${chatId}/close`)
};