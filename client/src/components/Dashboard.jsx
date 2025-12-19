import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InviteUser from './InviteUser';
import PendingInvites from './PendingInvites';
import ChatWindow from './ChatWindow';
import { chatsAPI } from '../services/api';

const Dashboard = ({ user, onLogout }) => {
    const [activeChats, setActiveChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadActiveChats();
        const interval = setInterval(loadActiveChats, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadActiveChats = async () => {
        try {
            const response = await chatsAPI.getActiveChats();
            setActiveChats(response.data.chats);
        } catch (error) {
            console.error('Failed to load chats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        onLogout();
        navigate('/');
    };

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
    };

    const handleChatClose = async () => {
        if (selectedChat) {
            try {
                await chatsAPI.closeChat(selectedChat.id);
                await loadActiveChats();
                setSelectedChat(null);
            } catch (error) {
                console.error('Failed to close chat:', error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Temporary Chatting
                            </h1>
                            <p className="text-gray-600">Welcome, {user.username}!</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                Invite Users
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left sidebar - Chats list */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Active Chats
                                </h2>
                            </div>

                            <PendingInvites user={user} onInviteAccept={loadActiveChats} />

                            <div className="p-6">
                                {loading ? (
                                    <div className="text-center py-4">Loading chats...</div>
                                ) : activeChats.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500">
                                        No active chats. Invite someone to start chatting!
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {activeChats.map((chat) => (
                                            <li key={chat.id}>
                                                <button
                                                    onClick={() => handleChatSelect(chat)}
                                                    className={`w-full text-left p-4 rounded-lg hover:bg-gray-50 ${selectedChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                                        }`}
                                                >
                                                    <div className="font-medium text-gray-900">
                                                        {chat.otherUser}
                                                    </div>
                                                    {chat.lastMessage && (
                                                        <div className="text-sm text-gray-500 truncate">
                                                            {chat.lastMessage.content}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Started: {new Date(chat.createdAt).toLocaleDateString()}
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main chat area */}
                    <div className="lg:col-span-2">
                        {selectedChat ? (
                            <ChatWindow
                                chat={selectedChat}
                                currentUser={user}
                                onChatClose={handleChatClose}
                            />
                        ) : (
                            <div className="bg-white rounded-lg shadow h-full flex items-center justify-center">
                                <div className="text-center p-8">
                                    <div className="text-gray-400 mb-4">
                                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                                        Select a chat to start messaging
                                    </h3>
                                    <p className="text-gray-600">
                                        Choose an active chat from the list or invite a new user to chat
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Invite User Modal */}
            {showInviteModal && (
                <InviteUser
                    onClose={() => setShowInviteModal(false)}
                    onInviteSent={loadActiveChats}
                />
            )}
        </div>
    );
};

export default Dashboard;