import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatsAPI } from '../services/api';

const ChatWindow = ({ chat, currentUser, onChatClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    // Removed unused loading state
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const loadMessages = useCallback(async () => {
        try {
            const response = await chatsAPI.getChatMessages(chat.id);
            setMessages(response.data.messages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }, [chat.id]);

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 2000);
        return () => clearInterval(interval);
    }, [chat.id, loadMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // loadMessages moved above and memoized with useCallback

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        setSending(true);
        try {
            await chatsAPI.sendMessage(chat.id, newMessage);
            setNewMessage('');
            loadMessages();
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleCloseChat = async () => {
        if (window.confirm('Are you sure you want to close this chat? All messages will be deleted.')) {
            await onChatClose();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Chat with {chat.otherUser}
                    </h3>
                    <p className="text-sm text-gray-500">
                        Chat ID: {chat.id.substring(0, 8)}...
                    </p>
                </div>
                <button
                    onClick={handleCloseChat}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                >
                    Close Chat
                </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${message.senderId === currentUser.id
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                                        }`}
                                >
                                    <div className="text-sm">{message.content}</div>
                                    <div
                                        className={`text-xs mt-1 ${message.senderId === currentUser.id
                                            ? 'text-blue-200'
                                            : 'text-gray-500'
                                            }`}
                                    >
                                        {new Date(message.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                    Note: When chat is closed, all messages will be permanently deleted after 1 minute.
                </p>
            </div>
        </div>
    );
};

export default ChatWindow;
